import { getRequestTenant } from '@/tenants/request';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenant = await getRequestTenant();
  if (tenant.indexable) return new Response('Not found', { status: 404 });
  const [r, g, b] = tenant.brand.colors.primary.split(' ');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="rgb(${r},${g},${b})"/>
  <path d="M8 22 L16 8 L24 22" fill="none" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
</svg>`;
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'x-robots-tag': 'noindex',
    },
  });
}
