import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { getAggregates, getBranding, getSettings, staffDirectory } from '@/cu/cu-store';
import { getCuTenant } from '@/cu/tenants';
import { saveSettingsAction, sendSummaryAction, signOut } from '../../actions';
import { BrandLockup } from '../../BrandLockup';
import { BrandingForm } from './BrandingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

type Section = 'usage' | 'branding' | 'settings';

function sectionFrom(query: { section?: string; saved?: string; error?: string; notice?: string }): Section {
  if (query.section === 'branding' || query.section === 'settings' || query.section === 'usage') return query.section;
  if (query.saved === 'branding' || query.error === 'branding') return 'branding';
  if (query.saved === 'settings' || query.saved === 'email' || query.error === 'email' || query.notice) return 'settings';
  return 'usage';
}

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
  searchParams: Promise<{ section?: string; saved?: string; error?: string; notice?: string }>;
}) {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) notFound();
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant.id)) redirect(`/cu/${tenant.id}/sign-in`);
  const brand = await resolveBrand(tenant);
  const aggregates = await getAggregates(tenant.id);
  const settings = await getSettings(tenant.id);
  const stored = await getBranding(tenant.id);
  const query = await searchParams;
  const section = sectionFrom(query);
  const notice = NOTICES[query.saved ?? ''] || NOTICES[query.notice ?? ''];
  const error = query.error === 'branding'
    ? 'Check the short name and colors.'
    : query.error === 'email'
      ? 'Check the credit-union email address.'
      : '';
  const staff = staffDirectory().filter(row => row.tenantId === tenant.id);
  const sourcePrimary = stored?.primary && /^#[0-9a-fA-F]{6}$/.test(stored.primary) ? stored.primary : tenant.brand.primary;
  const tabs: { id: Section; label: string }[] = [
    { id: 'usage', label: 'Usage' },
    { id: 'branding', label: 'Branding' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <header className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4">
          <BrandLockup
            name={tenant.name}
            shortName={brand.shortName}
            color={brand.brandText}
            mark={tenant.logo}
            logoLight={brand.logoLight}
            logoAspect={brand.logoAspect}
            fullNameOnPhone
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
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={`/cu/${tenant.id}/dashboard?section=${tab.id}`}
              className={`py-3 text-[15px] font-semibold ${section === tab.id ? 'cu-nav-active' : 'text-[#555]'}`}
              aria-current={section === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        {notice ? <p className="mb-6 text-[14px] font-semibold leading-[20px]" role="status">{notice}</p> : null}
        {error ? <p className="mb-6 text-[14px] font-semibold leading-[20px]" role="alert">{error}</p> : null}

        {section === 'usage' ? <section aria-labelledby="usage-heading">
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
          <div className="mt-10">
            <table className="w-full max-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[14px] leading-[20px] text-[#555]">
                  <th className="py-3 pr-4 font-semibold">Grade</th>
                  <th className="py-3 text-right font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                  <tr key={grade} className="border-b border-[#E5E5E5] text-[15px]">
                    <td className="py-3 pr-4">{grade}</td>
                    <td className="py-3 text-right tabular-nums">{aggregates.grades[grade]}</td>
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
        </section> : null}

        {section === 'branding' ? <section aria-labelledby="branding-heading">
          <h1 id="branding-heading" className="text-[32px] font-bold leading-[38px]">Branding</h1>
          <BrandingForm
            tenantId={tenant.id}
            shortName={brand.shortName}
            primary={sourcePrimary}
            secondary={brand.secondary ?? ''}
            logoLight={brand.logoLight ?? ''}
            logoDark={brand.logoDark ?? ''}
          />
        </section> : null}

        {section === 'settings' ? <section aria-labelledby="settings-heading">
          <h1 id="settings-heading" className="text-[32px] font-bold leading-[38px]">Settings</h1>
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
          <div className="mt-6">
            <p className="text-[14px] leading-[20px] text-[#555]">Emails the counts to the credit-union inbox.</p>
            <form action={sendSummaryAction} className="mt-2">
              <input type="hidden" name="tenant" value={tenant.id} />
              <button type="submit" className="cu-link text-[15px] font-semibold underline decoration-[#555] decoration-1 underline-offset-4">Send summary</button>
            </form>
          </div>
        </section> : null}
      </main>
    </>
  );
}
