import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { getAggregates, getSettings, staffDirectory } from '@/cu/cu-store';
import { getCuTenant } from '@/cu/tenants';
import { saveBrandingAction, saveSettingsAction, sendSummaryAction, signOut } from '../../actions';
import { BrandLockup } from '../../BrandLockup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, string> = {
  settings: 'Settings saved.',
  branding: 'Branding saved.',
  email: 'Summary sent.',
  disabled: 'Email is off for this credit union.',
  'not-configured': 'Email is on, but sending is not configured.',
  'missing-tenant': 'This credit union was not found.',
};

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ saved?: string; error?: string; notice?: string }>;
}) {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) notFound();
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant.id)) redirect(`/cu/${tenant.id}/sign-in`);
  const brand = await resolveBrand(tenant);
  const aggregates = await getAggregates(tenant.id);
  const settings = await getSettings(tenant.id);
  const query = await searchParams;
  const notice = NOTICES[query.saved ?? ''] || NOTICES[query.notice ?? ''];
  const error = query.error === 'branding'
    ? 'Check the short name, colors, and logo aspect.'
    : query.error === 'email'
      ? 'Check the credit-union email address.'
      : '';
  const staff = staffDirectory().filter(row => row.tenantId === tenant.id);

  return (
    <>
      <header className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4">
          <BrandLockup
            name={tenant.name}
            shortName={brand.shortName}
            color={brand.brandText}
            mark={tenant.logo}
            logoLight={brand.logoLight}
            logoAspect={brand.logoAspect}
          />
          <details className="relative shrink-0">
            <summary className="cursor-pointer text-[15px] font-semibold">Account</summary>
            <div className="absolute right-0 z-10 mt-2 w-56 border border-[#E5E5E5] bg-white p-4">
              <p className="text-[14px] leading-[20px] text-[#555]">{session?.role === 'admin' ? 'Admin' : 'Credit union account'}</p>
              <form action={signOut}>
                <input type="hidden" name="tenant" value={tenant.id} />
                <button type="submit" className="cu-link mt-3 text-[15px] font-semibold underline decoration-[#555] underline-offset-4">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <nav className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex w-full max-w-[1120px] gap-6 px-4">
          <a href="#usage" className="cu-nav-active py-3 text-[15px] font-semibold">Usage</a>
          <a href="#branding" className="py-3 text-[15px] font-semibold text-[#555]">Branding</a>
          <a href="#settings" className="py-3 text-[15px] font-semibold text-[#555]">Settings</a>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        {notice ? <p className="mb-6 text-[14px] font-semibold leading-[20px]" role="status">{notice}</p> : null}
        {error ? <p className="mb-6 text-[14px] font-semibold leading-[20px]" role="alert">{error}</p> : null}

        <section id="usage" aria-labelledby="usage-heading">
          <h1 id="usage-heading" className="text-[32px] font-bold leading-[38px]">Usage</h1>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
            <p>
              <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{aggregates.checks}</span>
              <span className="mt-2 block text-[14px] leading-[20px] text-[#555]">Checks</span>
            </p>
            <p>
              <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{aggregates.uploads}</span>
              <span className="mt-2 block text-[14px] leading-[20px] text-[#555]">Uploads read</span>
            </p>
            <p>
              <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{staff.length}</span>
              <span className="mt-2 block text-[14px] leading-[20px] text-[#555]">Accounts</span>
            </p>
          </div>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[14px] leading-[20px] text-[#555]">
                  <th className="py-3 pr-4 font-semibold">Grade</th>
                  <th className="py-3 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                  <tr key={grade} className="border-b border-[#E5E5E5] text-[15px]">
                    <td className="py-3 pr-4">{grade}</td>
                    <td className="py-3 tabular-nums">{aggregates.grades[grade]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <table className="mt-10 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[14px] leading-[20px] text-[#555]">
                <th className="py-3 pr-4 font-semibold">Account</th>
                <th className="py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(row => (
                <tr key={row.label} className="border-b border-[#E5E5E5] text-[15px]">
                  <td className="py-3 pr-4">{row.label}</td>
                  <td className="py-3">Credit union</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="branding" className="mt-16" aria-labelledby="branding-heading">
          <h2 id="branding-heading" className="text-[24px] font-bold leading-[30px]">Branding</h2>
          <p className="mt-4 text-[14px] leading-[20px] text-[#555]">Derived text {brand.brandText}. Fill {brand.brandFill}. Focus {brand.focus}.</p>
          <form action={saveBrandingAction} className="mt-6 grid max-w-[560px] gap-4">
            <input type="hidden" name="tenant" value={tenant.id} />
            <label className="text-[14px] font-semibold leading-[20px]">Short name
              <input name="shortName" defaultValue={brand.shortName} maxLength={24} required className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Primary
              <input name="primary" defaultValue={tenant.brand.primary} required className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Secondary
              <input name="secondary" defaultValue={brand.secondary ?? ''} className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Logo, light background
              <input name="logoLight" defaultValue={brand.logoLight ?? ''} className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Logo, dark background
              <input name="logoDark" defaultValue={brand.logoDark ?? ''} className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Logo aspect
              <input name="logoAspect" defaultValue={String(brand.logoAspect)} inputMode="decimal" required className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Font
              <select name="font" defaultValue={brand.font} className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] bg-white px-4 text-[16px] font-normal">
                <option value="inter">Inter</option>
                <option value="serif">Serif</option>
              </select>
            </label>
            <button type="submit" className="cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save branding</button>
          </form>
        </section>

        <section id="settings" className="mt-16" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="text-[24px] font-bold leading-[30px]">Settings</h2>
          <form action={saveSettingsAction} className="mt-6 grid max-w-[560px] gap-4">
            <input type="hidden" name="tenant" value={tenant.id} />
            <label className="flex items-center gap-2 text-[15px] font-semibold">
              <input type="checkbox" name="emailEnabled" defaultChecked={settings.emailEnabled} />
              Email aggregate summaries
            </label>
            <p className="text-[14px] leading-[20px] text-[#555]">Off by default. Summaries contain counts only.</p>
            <label className="text-[14px] font-semibold leading-[20px]">Credit-union inbox
              <input name="notifyEmail" type="email" defaultValue={settings.notifyEmail ?? ''} autoComplete="off" className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
            </label>
            <button type="submit" className="cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save settings</button>
          </form>
          <form action={sendSummaryAction} className="mt-6">
            <input type="hidden" name="tenant" value={tenant.id} />
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white px-4 text-[15px] font-semibold text-[#111] md:h-11" disabled={!settings.emailEnabled}>
              Send summary
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
