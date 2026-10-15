import { CU_TENANTS, getCuTenant } from './tenants';

/** Parent listens for these. Payloads stay grade and height only. */
export const EMBED_RESIZE = 'signorwalk.cu.resize';
export const EMBED_COMPLETED = 'signorwalk.cu.completed';

const EMBED_SITE = 'https://signorwalk.com';

export type ResizeMessage = { type: typeof EMBED_RESIZE; height: number };
export type CompletedMessage = { type: typeof EMBED_COMPLETED; grade: string };

export type EmbedDecision =
  | { ok: true; targetOrigin: string | null }
  | { ok: false };

const FRAMED = new Set(['iframe', 'frame', 'embed', 'object']);

/** https origins, plus http on localhost and 127.0.0.1. No paths, no wildcard. */
export function isEmbedOrigin(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return false;
  }
  if (url.origin !== normalized || url.username || url.password) return false;
  if (url.protocol === 'https:' && /^[a-z0-9.-]+$/.test(url.hostname) && url.hostname.includes('.')) return true;
  if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true;
  return false;
}

export function originOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const origin = new URL(value).origin;
    return isEmbedOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
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

/** CSP source list for a known embed route. Always includes 'self'. */
export function frameAncestorSources(origins: readonly string[]): string {
  const extra = origins.filter(isEmbedOrigin);
  return ["'self'", ...extra].join(' ');
}

/** 'none' for every path that is not a known tenant embed. */
export function frameAncestorsForPath(pathname: string): string {
  const id = embedTenantId(pathname);
  if (!id) return "'none'";
  const tenant = getCuTenant(id);
  if (!tenant) return "'none'";
  return frameAncestorSources(tenant.embedOrigins);
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

export function resizeMessage(height: number): ResizeMessage {
  const n = Math.ceil(height);
  if (!Number.isFinite(height) || n < 1 || n > 20000) throw new Error('height');
  return { type: EMBED_RESIZE, height: n };
}

export function completedMessage(grade: string): CompletedMessage {
  if (!/^[ABCDF]$/.test(grade)) throw new Error('grade');
  return { type: EMBED_COMPLETED, grade };
}

export function deepLink(tenantId: string): string {
  if (!/^[a-z0-9-]+$/.test(tenantId)) throw new Error('tenant');
  return `${EMBED_SITE}/cu/${tenantId}/embed`;
}

export function iframeSnippet(tenantId: string): string {
  const src = deepLink(tenantId);
  return `<iframe id="sow-cu" src="${src}" style="width:100%;border:0" title="Check a dealer offer"></iframe>
<script>
window.addEventListener('message', function (event) {
  if (event.origin !== '${EMBED_SITE}') return;
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
