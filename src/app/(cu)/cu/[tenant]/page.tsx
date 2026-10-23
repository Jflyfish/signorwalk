import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveBrand } from '@/cu/brand';
import { sampleCountsExcluded, sampleGrant } from '@/cu/sample-grant';
import { loadCuTenant, publicMemberLinks, tenantUnavailable } from '@/cu/tenant-directory';
import { getCuTenant, toCuPublic } from '@/cu/tenants';
import { Unavailable } from '../Unavailable';
import { BrandLockup } from '../BrandLockup';
import { CheckForm } from './CheckForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const tenant = await loadCuTenant((await params).tenant);
  if (tenant?.id === 'preview-sample-cu') return { title: 'Preview sample', robots: { index: false, follow: false } };
  if (tenant && tenantUnavailable(tenant)) return { title: 'Unavailable', robots: { index: false, follow: false } };
  return {};
}

export default async function CuPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ sample?: string }>;
}) {
  const query = await searchParams;
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  if (tenant.id === 'preview-sample-cu' && query.sample !== '1') notFound();
  if (tenantUnavailable(tenant)) return <Unavailable />;
  const grant = query.sample === '1' ? sampleGrant(tenant.id) : null;
  const sample = sampleCountsExcluded(tenant.id, query.sample === '1', grant);
  const brand = await resolveBrand(tenant);
  const pub = toCuPublic(tenant);
  const links = publicMemberLinks(tenant);
  pub.preApprovalUrl = links.preApprovalUrl;
  pub.ratesUrl = links.ratesUrl;
  return (
    <>
      <header className="cu-no-print sticky top-0 z-20 mx-auto flex min-h-16 w-full max-w-[560px] items-center bg-white px-4 py-4">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
        />
      </header>
      <CheckForm
        tenant={pub}
        brand={brand}
        demoSample={sample}
        autoGrade={sample}
        disclosure={tenant.disclosure}
        sampleRun={sample}
        sampleGrant={grant}
        demoPage={sample || Boolean(getCuTenant(tenant.id))}
      />
    </>
  );
}
