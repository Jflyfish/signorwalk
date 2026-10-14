import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sign or Walk for credit unions: Win back the auto loans dealers take from your members.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111827',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: '#3b82f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            SW
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700 }}>Sign or Walk</span>
            <span style={{ color: '#bfdbfe', fontSize: '18px', fontWeight: 600 }}>For credit unions</span>
          </div>
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: '58px',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-1px',
            maxWidth: '980px',
          }}
        >
          Win back the auto loans dealers take from your members.
        </div>
        <div style={{ color: '#e5e7eb', fontSize: '26px', marginTop: '28px', maxWidth: '860px', lineHeight: 1.35 }}>
          No member data stored. No core integration.
        </div>
      </div>
    ),
    { ...size },
  );
}
