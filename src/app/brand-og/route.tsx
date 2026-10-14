import { ImageResponse } from 'next/og';
import { getRequestTenant } from '@/tenants/request';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenant = await getRequestTenant();
  if (tenant.indexable) return new Response('Not found', { status: 404 });
  const [r, g, b] = tenant.brand.colors.primary.split(' ');
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: `rgb(${r}, ${g}, ${b})`,
          color: 'white',
          padding: '72px',
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700 }}>{tenant.brand.name}</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 16, lineHeight: 1.1 }}>Check a vehicle offer</div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>Educational comparison. Not an offer of credit.</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
