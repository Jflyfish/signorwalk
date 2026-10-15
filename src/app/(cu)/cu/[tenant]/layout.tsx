import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CU_TENANTS } from '@/cu/tenants';
import { loadCuTenant } from '@/cu/tenant-directory';
import { resolveBrand } from '@/cu/brand';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return CU_TENANTS.map(tenant => ({ tenant: tenant.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) {
    return {
      title: 'Page not found',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `Check a dealer offer — ${tenant.name}`,
    description: `Enter the numbers from a dealer worksheet. Educational comparison for ${tenant.name} members. Not an offer of credit.`,
    robots: { index: false, follow: false },
    alternates: { canonical: `https://signorwalk.com/cu/${tenant.id}` },
  };
}

export default async function CuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  const brand = await resolveBrand(tenant);
  return (
    <div
      className={`cu-shell min-h-screen bg-white cu-ink ${brand.font === 'serif' ? 'cu-serif' : ''}`}
      style={{
        ['--cu-fill' as string]: brand.brandFill,
        ['--cu-on' as string]: brand.onBrand,
        ['--cu-hover' as string]: brand.hover,
        ['--cu-text' as string]: brand.brandText,
        ['--cu-focus' as string]: brand.focus,
        ['--cu-tint' as string]: brand.tint,
      }}
    >
      <style>{`
        .cu-shell :focus-visible { outline: 2px solid var(--cu-focus); outline-offset: 2px; }
        .cu-serif { font-family: Georgia, "Iowan Old Style", Palatino, "Palatino Linotype", serif; }
        .cu-link { color: var(--cu-text); }
        .cu-primary { background: var(--cu-fill); color: var(--cu-on); }
        .cu-primary:hover { background: var(--cu-hover); }
        .cu-primary:disabled { opacity: 0.6; }
        .cu-nav-active { color: var(--cu-text); border-bottom: 2px solid var(--cu-text); }
      `}</style>
      <a href="#cu-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-[14px] focus:font-semibold">
        Skip to content
      </a>
      <div id="cu-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
