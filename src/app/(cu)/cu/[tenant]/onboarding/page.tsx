import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { getBranding } from '@/cu/cu-store';
import { iframeSnippet, memberOrigin } from '@/cu/embed';
import { loadCuTenant } from '@/cu/tenant-directory';
import { BrandLockup } from '../../BrandLockup';
import { StaffHeader } from '../../StaffHeader';
import { OnboardingWizard } from './OnboardingWizard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Set up your page',
  robots: { index: false, follow: false },
};

function stepFrom(value: string | undefined, stored: 1 | 2 | 3 | undefined): 1 | 2 | 3 {
  if (value === '1' || value === '2' || value === '3') return Number(value) as 1 | 2 | 3;
  return stored ?? 1;
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant.id)) redirect(`/cu/${tenant.id}/sign-in`);
  if (session?.role !== 'admin' && tenant.verified === false) redirect(`/cu/${tenant.id}/dashboard?notice=confirm`);
  const brand = await resolveBrand(tenant);
  const stored = await getBranding(tenant.id);
  const query = await searchParams;
  const requestHeaders = await headers();
  const origin = memberOrigin(name => requestHeaders.get(name), process.env.VERCEL_URL);
  const shareUrl = `${origin}/cu/${tenant.id}`;
  const logo = stored?.logoLight?.startsWith('https:') ? stored.logoLight : '';
  const color = stored?.primary && /^#[0-9a-fA-F]{6}$/.test(stored.primary) ? stored.primary : brand.brandFill;
  const loan = tenant.loanLinksSet === false ? '' : (tenant.preApprovalUrl.startsWith('https:') ? tenant.preApprovalUrl : '');

  return (
    <>
      <StaffHeader tenant={tenant.id}>
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
          fullNameOnPhone
        />
      </StaffHeader>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        <OnboardingWizard
          tenantId={tenant.id}
          initialStep={stepFrom(query.step, tenant.onboardingStep)}
          initialLogo={logo}
          initialColor={color}
          initialLoan={loan}
          initialDisclosure={tenant.disclosure ?? ''}
          shareUrl={shareUrl}
          snippet={iframeSnippet(tenant.id, origin)}
          pageUrl={shareUrl}
        />
      </main>
    </>
  );
}
