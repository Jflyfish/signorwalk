import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { resolveBrand } from '@/cu/brand';
import { allowEmbed, requestOriginFrom } from '@/cu/embed';
import { loadCuTenant } from '@/cu/tenant-directory';
import { toCuPublic } from '@/cu/tenants';
import { Unavailable } from '../../Unavailable';
import { BrandLockup } from '../../BrandLockup';
import { EmbedFrame } from './EmbedFrame';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const tenant = await loadCuTenant((await params).tenant);
  if (tenant?.status === 'paused') return { title: 'Unavailable', robots: { index: false, follow: false } };
  return {};
}

export default async function EmbedPage({ params }: { params: Promise<{ tenant: string }> }) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  if (tenant.status === 'paused') return <Unavailable />;
  const h = await headers();
  const decision = allowEmbed({
    tenantId: tenant.id,
    embedOrigins: tenant.embedOrigins,
    referer: h.get('referer'),
    secFetchDest: h.get('sec-fetch-dest'),
    requestOrigin: requestOriginFrom(name => h.get(name)),
  });
  if (!decision.ok) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-16">
        <h1 className="text-[24px] font-bold leading-[30px]">This page can&apos;t be shown here</h1>
        <p className="mt-4 text-[15px] leading-[24px] cu-muted">Open the check in the browser, or ask the credit union to allow this site.</p>
      </main>
    );
  }
  const brand = await resolveBrand(tenant);
  return (
    <div id="sow-embed-root">
      <header className="mx-auto flex min-h-14 w-full max-w-[560px] items-center px-4 py-3">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
          beside={false}
        />
      </header>
      <EmbedFrame tenant={toCuPublic(tenant)} brand={brand} targetOrigin={decision.targetOrigin} />
    </div>
  );
}
