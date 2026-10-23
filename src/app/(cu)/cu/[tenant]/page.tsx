import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveBrand } from '@/cu/brand';
import { loadCuTenant, tenantUnavailable } from '@/cu/tenant-directory';
import { toCuPublic } from '@/cu/tenants';
import { Unavailable } from '../Unavailable';
import { BrandLockup } from '../BrandLockup';
import { CheckForm } from './CheckForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const tenant = await loadCuTenant((await params).tenant);
  if (tenant && tenantUnavailable(tenant)) return { title: 'Unavailable', robots: { index: false, follow: false } };
  return {};
}

export default async function CuPage({ params }: { params: Promise<{ tenant: string }> }) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  if (tenantUnavailable(tenant)) return <Unavailable />;
  const brand = await resolveBrand(tenant);
  const pub = toCuPublic(tenant);
  if (tenant.loanLinksSet === false) {
    pub.preApprovalUrl = '';
    pub.ratesUrl = '';
  }
  return (
    <>
      <header className="cu-no-print mx-auto flex min-h-16 w-full max-w-[560px] items-center px-4 py-4">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
        />
      </header>
      <CheckForm tenant={pub} brand={brand} />
    </>
  );
}
