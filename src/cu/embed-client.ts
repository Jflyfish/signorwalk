/** Parent listens for these. Payloads stay grade and height only. */
export const EMBED_RESIZE = 'signorwalk.cu.resize';
export const EMBED_COMPLETED = 'signorwalk.cu.completed';

export type ResizeMessage = { type: typeof EMBED_RESIZE; height: number };
export type CompletedMessage = { type: typeof EMBED_COMPLETED; grade: string };

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

export function resizeMessage(height: number): ResizeMessage {
  const n = Math.ceil(height);
  if (!Number.isFinite(height) || n < 1 || n > 20000) throw new Error('height');
  return { type: EMBED_RESIZE, height: n };
}

export function completedMessage(grade: string): CompletedMessage {
  if (!/^[ABCDF]$/.test(grade)) throw new Error('grade');
  return { type: EMBED_COMPLETED, grade };
}
