export function BrandLockup({
  name,
  shortName,
  color,
  mark,
  logoLight,
  logoAspect = 1,
  beside = true,
  fullNameOnPhone = false,
  className = '',
  productLineClassName = '',
}: {
  name: string;
  shortName: string;
  color: string;
  mark?: 'harborlight' | 'summit' | 'larkspur';
  logoLight?: string;
  logoAspect?: number;
  beside?: boolean;
  /** Dashboard header: the full credit-union name, without the product line, on a phone. */
  fullNameOnPhone?: boolean;
  className?: string;
  productLineClassName?: string;
}) {
  const httpsLogo = logoLight?.startsWith('https://') || logoLight?.startsWith('data:image/') ? logoLight : undefined;
  const productLine = beside ? (
    <p className={`min-w-0 text-[14px] leading-[20px] cu-muted ${fullNameOnPhone ? 'hidden md:block' : ''} ${productLineClassName}`}>
      {httpsLogo || mark ? null : <span className="sr-only">{name} </span>}with Sign or Walk
    </p>
  ) : null;
  return (
    <div className={`flex min-w-0 items-center gap-2 ${fullNameOnPhone ? 'flex-1' : ''} ${className}`}>
      {httpsLogo ? (
        <img src={httpsLogo} alt="" className="h-7 w-auto max-w-[160px] object-contain md:h-8" style={{ aspectRatio: String(logoAspect) }} />
      ) : null}
      {fullNameOnPhone ? (
        <span className="min-w-0 text-[15px] font-semibold leading-[20px] md:hidden" style={{ color }}>{name}</span>
      ) : null}
      <span className={`min-w-0 truncate text-[15px] font-semibold leading-[20px] ${fullNameOnPhone ? 'hidden md:inline' : ''}`} style={{ color }}>{httpsLogo ? shortName : name}</span>
      {productLine}
    </div>
  );
}
