import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveBrand } from '@/cu/brand';
import { getTenantProfile, loadCuTenant } from '@/cu/tenant-directory';
import { tokensMatch } from '@/cu/trial-confirm';
import { BrandLockup } from '../../BrandLockup';
import { confirmTrial } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const id = (await params).tenant;
  const token = (await searchParams).token ?? '';
  const profile = await getTenantProfile(id);
  if (!profile?.confirmHash || !tokensMatch(token, profile.confirmHash)) {
    redirect(profile ? `/cu/${profile.id}/dashboard` : '/credit-unions');
  }
  const tenant = await loadCuTenant(profile.id);
  if (!tenant) redirect('/credit-unions');
  const brand = await resolveBrand(tenant);
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px] rounded-[12px] border cu-line bg-white p-6">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
        />
        <h1 className="mt-6 text-[24px] font-bold leading-[30px]">Confirm your email</h1>
        <p className="mt-4 text-[15px] leading-[24px]">
          Opening this page does not confirm the trial. Choose Confirm to turn on saving.
        </p>
        <form action={confirmTrial} className="mt-6">
          <input type="hidden" name="tenant" value={profile.id} />
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="cu-primary inline-flex h-12 items-center justify-center rounded-lg px-4 text-[15px] font-semibold">
            Confirm
          </button>
        </form>
      </div>
    </main>
  );
}
