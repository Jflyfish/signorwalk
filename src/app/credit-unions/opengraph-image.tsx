import { ImageResponse } from 'next/og';

export const alt = 'Win back the auto loans dealers take from your members.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#111827',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d1d5db' }}>
          Sign or Walk
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: 920 }}>
          Win back the auto loans dealers take from your members.
        </div>
      </div>
    ),
    { ...size },
  );
}
