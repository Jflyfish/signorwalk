'use client';

import { trackCtaClicked, type CtaTarget, type CuTenantId } from '@/lib/analytics-events';

export function CtaLink({
  href,
  tenant,
  target,
  className,
  children,
}: {
  href: string;
  tenant: CuTenantId;
  target: CtaTarget;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackCtaClicked({ tenant, target })}
    >
      {children}
    </a>
  );
}
