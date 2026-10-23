/** Which /cu URLs are real pages, and which must answer 404. */

const KNOWN_SUBPATH = new Set(['', 'embed', 'preview', 'dashboard', 'sign-in', 'confirm', 'onboarding']);

export type CuPathDisposition =
  | { kind: 'continue' }
  | { kind: 'missing' }
  | { kind: 'lookup'; id: string };

export function cuPathDisposition(pathname: string): CuPathDisposition {
  if (pathname === '/credit-unions' || pathname.startsWith('/credit-unions/')) return { kind: 'continue' };
  if (pathname === '/cu' || pathname === '/cu/') return { kind: 'missing' };
  const match = /^\/cu\/([^/]+)(.*)$/.exec(pathname);
  if (!match) return { kind: 'continue' };
  let id = match[1];
  try {
    id = decodeURIComponent(id);
  } catch {
    return { kind: 'missing' };
  }
  id = id.toLowerCase();
  const rest = match[2].replace(/\/+$/, '').replace(/^\//, '');
  if (id === 'admin') return rest === '' ? { kind: 'continue' } : { kind: 'missing' };
  if (rest === '' && (id === 'icon' || id === 'apple-icon' || id === 'opengraph-image' || id === 'twitter-image')) {
    return { kind: 'continue' };
  }
  if (!/^[a-z0-9-]{2,48}$/.test(id)) return { kind: 'missing' };
  if (!KNOWN_SUBPATH.has(rest)) return { kind: 'missing' };
  return { kind: 'lookup', id };
}
