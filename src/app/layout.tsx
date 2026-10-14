import type { Metadata } from 'next';
import { SowFrame, SowHead } from '@/components/shell/SowFrame';
import { TenantFrame } from '@/components/tenant/TenantFrame';
import { rootMetadata } from '@/lib/tenant-metadata';
import { getRequestTenant } from '@/tenants/request';
import { toPublicTenant } from '@/tenants/public';
import type { Tenant } from '@/tenants/types';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata(await getRequestTenant());
}

function brandStyle(tenant: Tenant): React.CSSProperties {
  return {
    ['--brand-primary' as string]: tenant.brand.colors.primary,
    ['--brand-primary-fg' as string]: tenant.brand.colors.primaryFg,
    ['--brand-accent' as string]: tenant.brand.colors.accent,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getRequestTenant();
  if (tenant.id === 'sow') {
    return (
      <html lang="en">
        <SowHead />
        <body className="min-h-screen bg-slate-50">
          <SowFrame>{children}</SowFrame>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" style={brandStyle(tenant)}>
      <body className="min-h-screen bg-slate-50 text-gray-900">
        <TenantFrame tenant={toPublicTenant(tenant)}>{children}</TenantFrame>
      </body>
    </html>
  );
}
