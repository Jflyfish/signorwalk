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
    <p className={`shrink-0 whitespace-nowrap text-[14px] leading-[20px] cu-muted ${fullNameOnPhone ? 'hidden md:block' : ''} ${productLineClassName}`}>
      {httpsLogo || mark ? null : <span className="sr-only">{name} </span>}
      <span className="whitespace-nowrap">with Sign or Walk</span>
    </p>
  ) : null;
  const wordmark = httpsLogo ? shortName : name;
  const wordmarkClass = 'block w-full min-w-0 max-w-full break-words text-[15px] font-semibold leading-[20px] max-h-10 overflow-hidden';
  // The row stays left-grouped. The name may shrink and wrap; the product line does not.
  const width = fullNameOnPhone ? 'w-full min-w-0 flex-1' : 'w-full min-w-0';
  return (
    <div className={`flex max-w-full flex-col items-start sm:flex-row sm:items-center sm:justify-start sm:gap-2 ${width} ${className}`}>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
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
