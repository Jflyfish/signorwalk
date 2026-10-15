import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/cu/headers';
import { FILE_READ_ERROR } from '@/cu/copy';
import { formatOcrLog, OCR_PROMPT, pickOcrFields, type OcrOutcome } from '@/cu/ocr';
import { recordUpload } from '@/cu/cu-store';
import { missingTenantResponse } from '@/cu/missing-page';
import { clientAddress, takeExtractSlot } from '@/cu/rate-limit';
import { getCuTenant } from '@/cu/tenants';

const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function json(pathname: string, body: unknown, status: number, extra?: Record<string, string>) {
  const res = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  return applySecurityHeaders(res, pathname);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await ctx.params;
  const pathname = `/api/cu/${slug}/extract`;
  const tenant = getCuTenant(slug);
  if (!tenant) return missingTenantResponse(pathname);
  if (req.method !== 'POST') {
    return applySecurityHeaders(new NextResponse(null, { status: 405, headers: { Allow: 'POST' } }), pathname);
  }

  const started = Date.now();
  const log = (outcome: OcrOutcome) => {
    console.log(formatOcrLog({
      ts: new Date().toISOString(),
      tenant: tenant.id,
      route: '/api/cu/extract',
      outcome,
      latencyMs: Date.now() - started,
    }));
  };

  const limit = takeExtractSlot(clientAddress(req.headers));
  if (!limit.allowed) {
    log('rejected');
    return json(pathname, { success: false, error: 'Too many uploads. Enter the numbers instead.' }, 429, {
      'Retry-After': String(limit.retryAfterSec),
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    log('unconfigured');
    return json(pathname, { success: false, error: 'Upload reading is not configured. Enter the numbers instead.' }, 503);
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      log('invalid');
      return json(pathname, { success: false, error: 'Choose a worksheet image or PDF.' }, 400);
    }
    if (file.size > MAX_FILE) {
      log('rejected');
      return json(pathname, { success: false, error: 'That file is too large. Enter the numbers instead.' }, 413);
    }
    const media = file.type.toLowerCase().split(';')[0].trim();
    const mediaType = media === 'image/jpg' ? 'image/jpeg' : media;
    if (!ALLOWED.has(mediaType)) {
      log('rejected');
      return json(pathname, { success: false, error: 'Use a JPG, PNG, WEBP, or PDF.' }, 415);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString('base64');
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const block = mediaType === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
            data: base64,
          },
        };
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: [block, { type: 'text', text: OCR_PROMPT }] }],
    });
    const content = message.content.find(part => part.type === 'text');
    if (!content || content.type !== 'text') {
      log('error');
      return json(pathname, { success: false, error: FILE_READ_ERROR }, 502);
    }
    let text = content.text;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    text = '';
    if (!parsed) {
      log('invalid');
      return json(pathname, { success: false, error: FILE_READ_ERROR }, 422);
    }
    const picked = pickOcrFields(parsed);
    await recordUpload(tenant.id).catch(() => undefined);
    log('ok');
    return json(pathname, { success: true, ...picked }, 200);
  } catch {
    log('error');
    return json(pathname, { success: false, error: FILE_READ_ERROR }, 500);
  }
}
