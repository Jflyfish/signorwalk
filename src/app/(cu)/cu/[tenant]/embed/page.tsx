import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveBrand } from '@/cu/brand';
import { numbersOnlyEmbed } from '@/cu/demo-upload';
import { allowEmbed, deepLink, requestOriginFrom } from '@/cu/embed';
import { loadCuTenant, memberRatesUrl, tenantUnavailable } from '@/cu/tenant-directory';
import { getCuTenant, toCuPublic } from '@/cu/tenants';
import { Unavailable } from '../../Unavailable';
import { BrandLockup } from '../../BrandLockup';
import { EmbedFrame } from './EmbedFrame';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const tenant = await loadCuTenant((await params).tenant);
  if (tenant && tenantUnavailable(tenant)) return { title: 'Unavailable', robots: { index: false, follow: false } };
  return {};
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ entry?: string }>;
}) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  if (tenantUnavailable(tenant)) return <Unavailable />;
  const query = await searchParams;
  const h = await headers();
  const numbersOnly = numbersOnlyEmbed(tenant.id, query.entry, h.get('referer'));
  const decision = allowEmbed({
    tenantId: tenant.id,
    embedOrigins: tenant.embedOrigins,
    referer: h.get('referer'),
    secFetchDest: h.get('sec-fetch-dest'),
    requestOrigin: requestOriginFrom(name => h.get(name)),
  });
  if (!decision.ok) {
    const origin = requestOriginFrom(name => h.get(name)) ?? 'https://signorwalk.com';
    const link = deepLink(tenant.id, origin);
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-16">
        <h1 className="text-[24px] font-bold leading-[30px]">This check isn&apos;t set up for this website.</h1>
        <p className="mt-4 text-[15px] leading-[24px] cu-muted">
          Open it at <a href={link} className="underline underline-offset-4 cu-linkline">{link}</a>
        </p>
      </main>
    );
  }
  const brand = await resolveBrand(tenant);
  const pub = toCuPublic(tenant);
  if (tenant.loanLinksSet === false) {
    pub.preApprovalUrl = '';
    pub.ratesUrl = '';
  } else {
    pub.ratesUrl = memberRatesUrl(tenant);
  }
  return (
    <div id="sow-embed-root">
      <header className="cu-no-print sticky top-0 z-20 mx-auto flex min-h-14 w-full max-w-[560px] items-center bg-white px-4 py-3">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
          productLineClassName="cu-embed-attribution"
        />
      </header>
      <EmbedFrame
        tenant={pub}
        brand={brand}
        targetOrigin={decision.targetOrigin}
        numbersOnly={numbersOnly}
        demoSample={query.entry === 'numbers'}
        disclosure={tenant.disclosure}
        demoPage={Boolean(getCuTenant(tenant.id))}
      />
    </div>
  );
}
