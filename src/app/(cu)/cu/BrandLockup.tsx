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
  const wordmark = httpsLogo ? shortName : name;
  const wordmarkClass = 'block w-full min-w-0 break-words text-[15px] font-semibold leading-[20px] max-h-10 overflow-hidden';
  return (
    <div className={`flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2 ${fullNameOnPhone ? 'flex-1' : ''} ${className}`}>
      <div className="flex min-w-0 w-full items-center gap-2">
        {httpsLogo ? (
          <img src={httpsLogo} alt="" className="h-7 w-auto max-w-[160px] shrink-0 object-contain md:h-8" style={{ aspectRatio: String(logoAspect) }} />
        ) : null}
        {fullNameOnPhone ? (
          <span className={`${wordmarkClass} md:hidden`} style={{ color }}>{name}</span>
        ) : null}
        <span className={`${wordmarkClass} ${fullNameOnPhone ? 'hidden md:block' : ''}`} style={{ color }}>{wordmark}</span>
      </div>
      {productLine}
    </div>
  );
}
