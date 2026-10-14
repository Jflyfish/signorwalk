import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './headers';

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Page not found</title>
<style>
  body { margin: 0; background: #fff; color: #111; font-family: Inter, system-ui, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 96px 16px; }
  p { margin: 16px 0 0; font-size: 18px; line-height: 28px; color: #555; }
  h1 { margin: 0; font-size: 32px; line-height: 38px; font-weight: 800; }
</style>
</head>
<body>
<main>
<h1>Page not found</h1>
<p>This credit union page does not exist.</p>
</main>
</body>
</html>
`;

/** Full document, so the root layout’s consumer chrome is not rendered. */
export function missingTenantResponse(pathname: string): NextResponse {
  const res = new NextResponse(PAGE, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
  return applySecurityHeaders(res, pathname);
}
