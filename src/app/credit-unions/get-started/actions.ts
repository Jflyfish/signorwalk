'use server';

/** PAYMENTS ARE NOT BUILT. Signup starts a trial. Nothing here takes a card. */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CU_SESSION_COOKIE, signSession } from '@/cu/auth';
import { appendAudit } from '@/cu/cu-store';
import { requestOriginFrom } from '@/cu/embed';
import { sendSignupNotice, sendTrialConfirm } from '@/cu/notify';
import { clientAddress, takeSignupSlot } from '@/cu/rate-limit';
import { createTrial } from '@/cu/trial';

const BACK = '/credit-unions/get-started';

function tierParam(value: string): string {
  return value === 'starter' || value === 'growth' || value === 'pro' ? value : '';
}

function fail(code: string, tier: string): never {
  const query = new URLSearchParams({ error: code });
  if (tier) query.set('tier', tier);
  redirect(`${BACK}?${query}`);
}

async function secureCookie(): Promise<boolean> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) return proto === 'https';
  const host = h.get('host') ?? '';
  return !host.startsWith('127.0.0.1') && !host.startsWith('localhost');
}

export async function startTrialAction(formData: FormData) {
  const tier = tierParam(String(formData.get('tier') ?? ''));
  const h = await headers();
  if (!takeSignupSlot(clientAddress(h)).allowed) fail('rate', tier);
  const result = await createTrial({
    name: String(formData.get('name') ?? ''),
    contactName: String(formData.get('contact') ?? ''),
    email: String(formData.get('email') ?? ''),
    secret: String(formData.get('password') ?? ''),
    website: String(formData.get('website') ?? ''),
    honeypot: String(formData.get('company') ?? ''),
  });
  if (!result.ok) fail(result.error === 'honeypot' ? 'start' : result.error, tier);
  const token = signSession({ role: 'cu', tenantId: result.id, exp: Date.now() + 60 * 60 * 12 * 1000 });
  if (!token) fail('unconfigured', tier);
  const jar = await cookies();
  jar.set(CU_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: await secureCookie(),
    maxAge: 60 * 60 * 12,
  });
  const origin = requestOriginFrom(name => h.get(name));
  if (origin) {
    await sendTrialConfirm(
      String(formData.get('email') ?? '').trim(),
      String(formData.get('name') ?? '').trim(),
      `${origin}/cu/${result.id}/confirm?token=${result.confirmToken}`,
    );
  }
  await sendSignupNotice(String(formData.get('name') ?? '').trim(), result.id);
  await appendAudit('create', result.id, 'tenant');
  redirect(`/cu/${result.id}/dashboard`);
}
