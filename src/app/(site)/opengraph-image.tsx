import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sign or Walk — Know Before You Sign';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              background: '#3b82f6',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '30px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Sign or Walk
          </span>
        </div>
        <div
          style={{
            color: 'white',
            fontSize: '58px',
            fontWeight: '900',
            textAlign: 'center',
            lineHeight: 1.08,
            marginBottom: '24px',
            letterSpacing: '-1px',
          }}
        >
          Know before you sign.
        </div>
        <div
          style={{
            color: '#94a3b8',
            fontSize: '24px',
            textAlign: 'center',
            maxWidth: '820px',
            lineHeight: 1.45,
          }}
        >
          Free AI car deal grader. Grade your lease or finance deal in 30 seconds — every red flag, every number.
        </div>
      </div>
    ),
    { ...size }
  );
}
