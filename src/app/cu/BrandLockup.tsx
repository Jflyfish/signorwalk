export function BrandLockup({
  name,
  shortName,
  color,
  mark,
  logoLight,
  logoAspect = 1,
  beside = true,
}: {
  name: string;
  shortName: string;
  color: string;
  mark?: 'harborlight' | 'summit';
  logoLight?: string;
  logoAspect?: number;
  beside?: boolean;
}) {
  const custom = Boolean(logoLight && !logoLight.startsWith('/cu-brand/'));
  return (
    <div className="flex min-w-0 items-center gap-2">
      {custom ? (
        <img src={logoLight} alt={name} className="h-7 w-auto max-w-[160px] object-contain md:h-8" style={{ aspectRatio: String(logoAspect) }} />
      ) : mark ? (
        <span className="inline-flex h-7 max-w-[160px] items-center md:h-8" style={{ aspectRatio: String(logoAspect) }}>
          {mark === 'harborlight' ? (
            <svg viewBox="0 0 32 32" className="h-full w-full" role="img" aria-label={name}>
              <path d="M16 6v14M10 20h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
              <path d="M16 10l8 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 32 32" className="h-full w-full" role="img" aria-label={name}>
              <path d="M6 24l10-14 10 14" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      ) : null}
      <span className="truncate text-[15px] font-semibold leading-[20px] text-[#111]">{shortName}</span>
      {beside ? (
        <p className="min-w-0 text-[14px] leading-[20px] text-[#555]">
          {custom || mark ? null : <span className="sr-only">{name} </span>}with Sign or Walk
        </p>
      ) : null}
    </div>
  );
}
