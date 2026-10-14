export function TenantLogo({ logo, className }: { logo: 'harborlight' | 'summit'; className?: string }) {
  if (logo === 'harborlight') {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M8 20.5c2.2-3.2 4.4-7.5 8-11 3.6 3.5 5.8 7.8 8 11" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 9.5v13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11 22.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M6 22 L13 12 L17 18 L22 10 L26 22 Z" fill="white" />
    </svg>
  );
}
