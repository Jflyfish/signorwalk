const HIDE = `body > nav, body > footer { display: none !important; } body { background: #fff; }`;

/**
 * Status boundary only. The sentence stays out of this file so healthy
 * /cu pages do not ship it in the RSC payload. Middleware returns the 404 document.
 */
export default function CuNotFound() {
  return <style>{HIDE}</style>;
}
