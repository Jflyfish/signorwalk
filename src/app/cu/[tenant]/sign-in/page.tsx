import type { Metadata } from 'next';
import { resolveBrand } from '@/cu/brand';
import { loadCuTenant } from '@/cu/tenant-directory';
import { TALK_TO_US_EMAIL } from '@/app/credit-unions/pricing';
import { signIn } from '../../actions';
import { BrandLockup } from '../../BrandLockup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  denied: 'Those credentials were not recognized.',
  unconfigured: `Sign-in isn't available yet. Contact ${TALK_TO_US_EMAIL}.`,
};

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) return null;
  const brand = await resolveBrand(tenant);
  const error = ERRORS[(await searchParams).error ?? ''];
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
        <h1 className="mt-6 text-[24px] font-bold leading-[30px]">Sign in</h1>
        {error ? <p className="mt-4 text-[14px] font-semibold leading-[20px]" role="alert">{error}</p> : null}
        <form action={signIn} className="mt-6 grid gap-4">
          <input type="hidden" name="tenant" value={tenant.id} />
          <div>
            <label htmlFor="email" className="mb-2 block text-[14px] font-semibold leading-[20px]">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="h-12 w-full rounded-lg border cu-line px-4 text-[16px]" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-[14px] font-semibold leading-[20px]">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="h-12 w-full rounded-lg border cu-line px-4 text-[16px]" />
          </div>
          <button type="submit" className="cu-primary inline-flex h-12 items-center justify-center rounded-lg px-4 text-[15px] font-semibold">
            Sign in
          </button>
        </form>
        <p className="mt-6 text-[14px] leading-[20px] cu-muted">
          Trouble signing in? <a href={`mailto:${TALK_TO_US_EMAIL}`} className="cu-link underline underline-offset-4 cu-linkline">{TALK_TO_US_EMAIL}</a>
        </p>
        <p className="mt-4 text-[14px] leading-[20px] cu-muted">Powered by Sign or Walk</p>
      </div>
    </main>
  );
}
