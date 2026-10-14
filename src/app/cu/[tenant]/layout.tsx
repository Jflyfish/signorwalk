import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CU_TENANTS, getCuTenant, toCuPublic } from '@/cu/tenants';
import { DealStorageReset } from './DealStorageReset';

export function generateStaticParams() {
  return CU_TENANTS.map(tenant => ({ tenant: tenant.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) return { title: 'Not found', robots: { index: false, follow: false } };
  const title = `${tenant.name} — Check a vehicle offer`;
  const description = `Educational comparison of a vehicle lease or finance offer for ${tenant.name} members. Not an offer of credit.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `https://signorwalk.com/cu/${tenant.id}` },
  };
}

function Mark({ logo }: { logo: 'harborlight' | 'summit' }) {
  if (logo === 'harborlight') {
    return (
      <svg viewBox="0 0 32 32" className="w-9 h-9" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.16" />
        <path d="M16 7v13M11 20h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 11l7 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="w-9 h-9" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.16" />
      <path d="M7 22l9-12 9 12" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default async function CuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) notFound();
  const pub = toCuPublic(tenant);
  const primary = `rgb(${pub.colors.primary})`;
  const fg = `rgb(${pub.colors.primaryFg})`;
  const accent = `rgb(${pub.colors.accent})`;

  return (
    <>
      <style>{'body > nav, body > footer { display: none !important; }'}</style>
      <DealStorageReset />
      <a
        href="#cu-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col">
        <header className="sticky top-0 z-40" style={{ backgroundColor: primary, color: fg }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex items-center justify-between gap-4">
            <a href={`/cu/${pub.id}`} className="flex items-center gap-3 min-w-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <Mark logo={pub.logo} />
              <span className="min-w-0">
                <span className="block font-bold tracking-tight leading-tight">{pub.name}</span>
                <span className="hidden sm:block text-xs opacity-80">{pub.tagline}</span>
              </span>
            </a>
            <a
              href={pub.privacyUrl}
              className="text-sm font-semibold shrink-0 rounded-md px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Privacy
            </a>
          </div>
        </header>
        <div id="cu-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </div>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
            <p className="text-sm font-semibold text-gray-900">{pub.legalName}</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Educational estimate only. Not an offer of credit and not financial, legal, or tax advice. Confirm every figure with the dealer. {pub.name} does not endorse any dealer.
            </p>
            <p className="text-sm">
              <a href={pub.privacyUrl} className="font-semibold underline underline-offset-2" style={{ color: accent }}>Privacy</a>
              <span className="text-gray-400 px-2" aria-hidden="true">·</span>
              <a href={pub.supportUrl} className="font-semibold underline underline-offset-2" style={{ color: accent }}>Support</a>
            </p>
            <p className="text-sm text-gray-700">Powered by Sign or Walk, an independent provider.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
