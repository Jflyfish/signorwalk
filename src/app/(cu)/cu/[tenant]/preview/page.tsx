import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { loadCuTenant, memberRatesUrl } from '@/cu/tenant-directory';
import { getCuTenant, toCuPublic } from '@/cu/tenants';
import { BrandLockup } from '../../BrandLockup';
import { CheckForm } from '../CheckForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

/**
 * Signed-in staff only. Shows the draft brand before email confirmation.
 * This route does not use the public unavailable page.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-16">
        <h1 className="text-[24px] font-bold leading-[30px]">This credit union was not found.</h1>
      </main>
    );
  }
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant.id)) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-16">
        <h1 className="text-[24px] font-bold leading-[30px]">Sign in to preview this page.</h1>
        <p className="mt-4 text-[15px] leading-[24px]">
          <a href={`/cu/${tenant.id}/sign-in`} className="underline underline-offset-4 cu-linkline">Sign in</a>
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
  const demoPage = Boolean(getCuTenant(tenant.id));
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
      <CheckForm tenant={pub} brand={brand} disclosure={tenant.disclosure} demoPage={demoPage} />
    </>
  );
}
