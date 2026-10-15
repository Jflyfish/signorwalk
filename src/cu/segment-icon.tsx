import { ImageResponse } from 'next/og';

/** Tab icon for credit-union routes. The consumer icon stays in src/app/icon.tsx. */
export function cuSegmentIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111111',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: Math.round(size * 0.38),
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        CU
      </div>
    ),
    { width: size, height: size },
  );
}
