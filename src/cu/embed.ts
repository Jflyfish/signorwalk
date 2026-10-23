import { createHmac, timingSafeEqual } from 'crypto';
import {
  clearFrameAncestorCache,
  cuStoreUnavailable,
  readFrameAncestorCache,
  writeFrameAncestorCache,
} from './cu-store';
import { CU_TENANTS, getCuTenant } from './tenants';
import { EMBED_COMPLETED, EMBED_RESIZE, isEmbedOrigin, originOf } from './embed-client';

export { clearFrameAncestorCache };
export {
  EMBED_COMPLETED,
  EMBED_RESIZE,
  completedMessage,
  isEmbedOrigin,
  originOf,
  resizeMessage,
  type CompletedMessage,
  type ResizeMessage,
} from './embed-client';

const EMBED_SITE = 'https://signorwalk.com';

export type EmbedDecision =
  | { ok: true; targetOrigin: string | null }
  | { ok: false };

const FRAMED = new Set(['iframe', 'frame', 'embed', 'object']);

/** Public site origin for member links. Request host first, then VERCEL_URL, then production. */
export function memberOrigin(get: (name: string) => string | null, envUrl?: string | null): string {
  const fromRequest = requestOriginFrom(get);
  if (fromRequest) return fromRequest;
  const raw = (envUrl ?? '').trim();
  if (raw) {
    const host = raw.replace(/^https?:\/\//i, '').split('/')[0]?.trim().toLowerCase() ?? '';
    const origin = host ? `https://${host}` : '';
    if (origin && isEmbedOrigin(origin)) return origin;
  }
  return 'https://signorwalk.com';
}

export function requestOriginFrom(get: (name: string) => string | null): string | null {
  const host = (get('x-forwarded-host') ?? get('host') ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  if (!host || /[\s/]/.test(host)) return null;
  let proto = (get('x-forwarded-proto') ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  if (proto !== 'http' && proto !== 'https') {
    proto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  }
  const origin = `${proto}://${host}`;
  return isEmbedOrigin(origin) ? origin : null;
}

export function embedTenantId(pathname: string): string | null {
  const match = /^\/cu\/([a-z0-9-]+)\/embed\/?$/.exec(pathname.toLowerCase());
  return match ? match[1] : null;
}

/** Staff preview. Framed only by this origin. Not the public embed. */
export function previewTenantId(pathname: string): string | null {
  const match = /^\/cu\/([a-z0-9-]+)\/preview\/?$/.exec(pathname.toLowerCase());
  return match ? match[1] : null;
}

/** CSP source list for a known embed route. Always includes 'self'. */
export function frameAncestorSources(origins: readonly string[]): string {
  const extra = origins.filter(isEmbedOrigin);
  return ["'self'", ...extra].join(' ');
}

/** Accept a CSP source list that this module produced. Rejects wildcards and extra directives. */
export function acceptAncestors(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || /[;,*]/.test(value)) return null;
  const parts = value.split(' ');
  if (parts.length === 1 && (parts[0] === "'none'" || parts[0] === "'self'")) return parts[0];
  if (parts[0] !== "'self'") return null;
  if (parts.slice(1).some(part => !isEmbedOrigin(part))) return null;
  return parts.join(' ');
}

const FRAME_CACHE_MS = 30_000;
export const FRAME_ANCESTORS_HEADER = 'x-cu-frame-ancestors';

/** Shared by middleware and the frame-ancestors route. Not a tenant secret. */
export function frameAncestorsToken(): string {
  const dedicated = process.env.CU_FRAME_ANCESTORS_SECRET?.trim();
  if (dedicated) return dedicated;
  const session = process.env.CU_SESSION_SECRET?.trim();
  if (session) return createHmac('sha256', session).update('frame-ancestors').digest('hex');
  return 'frame-ancestors';
}

export function frameAncestorsAuthorized(header: string | null): boolean {
  const expected = Buffer.from(frameAncestorsToken());
  const got = Buffer.from(header ?? '');
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

/**
 * Stored allowlist for an embed route. A missing tenant is 'none'.
 * A store failure is 'none' and is not cached. A thrown lookup or a timeout
 * is 'self' and is not cached. Config seeds are never the CSP fallback.
 */
export async function resolveFrameAncestors(
  pathname: string,
  load: (id: string) => Promise<{ embedOrigins: readonly string[] } | null>,
  now = Date.now(),
  ms = 1500,
): Promise<string> {
  const id = embedTenantId(pathname);
  if (!id) return "'none'";
  const cached = readFrameAncestorCache(id, now);
  if (cached) return cached;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const tenant = await Promise.race([
      load(id),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('frame-ancestors-timeout')), ms);
      }),
    ]);
    if (!tenant) {
      writeFrameAncestorCache(id, "'none'", now + FRAME_CACHE_MS);
      return "'none'";
    }
    const value = frameAncestorSources(tenant.embedOrigins);
    writeFrameAncestorCache(id, value, now + FRAME_CACHE_MS);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === 'store-unavailable') return "'none'";
    return "'self'";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function frameAncestorsForPath(pathname: string): Promise<string> {
  if (previewTenantId(pathname)) return "'self'";
  const { loadCuTenant } = await import('./tenant-directory');
  return resolveFrameAncestors(pathname, async (id) => {
    const tenant = await loadCuTenant(id);
    if (cuStoreUnavailable()) throw new Error('store-unavailable');
    return tenant ?? null;
  });
}

export function allowEmbed(input: {
  tenantId: string | null | undefined;
  /** Stored allowlist. When set, it replaces the config seed list. */
  embedOrigins?: readonly string[];
  referer: string | null;
  secFetchDest: string | null;
  requestOrigin: string | null;
}): EmbedDecision {
  const tenant = getCuTenant(input.tenantId);
  const origins = input.embedOrigins ?? tenant?.embedOrigins;
  if (!origins) return { ok: false };
  const allowed = new Set(origins.filter(isEmbedOrigin));
  if (input.requestOrigin && isEmbedOrigin(input.requestOrigin)) allowed.add(input.requestOrigin);
  const referer = originOf(input.referer);
  if (referer) {
    if (!allowed.has(referer)) return { ok: false };
    return { ok: true, targetOrigin: referer };
  }
  const dest = (input.secFetchDest ?? '').trim().toLowerCase();
  if (FRAMED.has(dest)) return { ok: false };
  return { ok: true, targetOrigin: null };
}

export function deepLink(tenantId: string, origin = EMBED_SITE): string {
  if (!/^[a-z0-9-]+$/.test(tenantId)) throw new Error('tenant');
  const base = isEmbedOrigin(origin) ? origin : EMBED_SITE;
  return `${base}/cu/${tenantId}/embed`;
}

export function iframeSnippet(tenantId: string, origin = EMBED_SITE): string {
  const base = isEmbedOrigin(origin) ? origin : EMBED_SITE;
  const src = deepLink(tenantId, base);
  return `<iframe id="sow-cu" src="${src}" style="width:100%;border:0" title="Check a dealer offer"></iframe>
<script>
window.addEventListener('message', function (event) {
  if (event.origin !== '${base}') return;
  var frame = document.getElementById('sow-cu');
  if (frame && event.data && event.data.type === '${EMBED_RESIZE}' && typeof event.data.height === 'number') {
    frame.style.height = event.data.height + 'px';
  }
});
</script>`;
}

function assertEmbedOrigins(): void {
  for (const tenant of CU_TENANTS) {
    if (tenant.embedOrigins.length === 0) throw new Error(`${tenant.id} embed`);
    for (const origin of tenant.embedOrigins) {
      if (!isEmbedOrigin(origin)) throw new Error(`${tenant.id} embed origin`);
      if (origin.includes('*')) throw new Error(`${tenant.id} embed wildcard`);
    }
  }
}

assertEmbedOrigins();
