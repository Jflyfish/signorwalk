import type { Metadata } from 'next';
import { inter } from '@/cu/inter';
import { CU_TENANTS, getCuTenant, toCuPublic } from '@/cu/tenants';
import { DealStorageReset } from './DealStorageReset';

export function generateStaticParams() {
  return CU_TENANTS.map(tenant => ({ tenant: tenant.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) {
    return {
      title: 'Page not found',
      description: 'This credit union page does not exist.',
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

function Mark({ logo, color }: { logo: 'harborlight' | 'summit'; color: string }) {
  if (logo === 'harborlight') {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path d="M16 6v14M10 20h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M16 10l8 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path d="M6 24l10-14 10 14" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
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
  if (!tenant) {
    return (
      <div className={`${inter.className} min-h-screen bg-white text-[#111]`}>
        <style>{'body > nav, body > footer { display: none !important; } body { background: #fff; }'}</style>
        {children}
      </div>
    );
  }
  const pub = toCuPublic(tenant);
  const accent = `rgb(${pub.colors.accent})`;

  return (
    <div className={`${inter.className} cu-shell min-h-screen bg-white text-[#111]`} style={{ ['--cu-accent' as string]: accent }}>
      <style>{`
        body > nav, body > footer { display: none !important; }
        body { background: #fff; }
        .cu-shell :focus-visible { outline: 2px solid var(--cu-accent); outline-offset: 2px; }
      `}</style>
      <DealStorageReset />
      <a href="#cu-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-[14px] focus:font-semibold">
        Skip to content
      </a>
      <header className="mx-auto flex min-h-16 w-full max-w-[560px] items-center gap-2 px-4 py-4">
        <Mark logo={pub.logo} color={accent} />
        <p className="min-w-0 text-[14px] leading-[20px] text-[#555]">
          <span className="font-semibold text-[#111]">{pub.name}</span> with Sign or Walk
        </p>
      </header>
      <div id="cu-content" tabIndex={-1} className="outline-none">
        {children}
      </div>
    </div>
  );
}
