import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { getAggregates, getBranding, getSettings } from '@/cu/cu-store';
import { getCuTenant } from '@/cu/tenants';
import { AccountMenu } from '../../AccountMenu';
import { saveSettingsAction, sendSummaryAction } from '../../actions';
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
  const error = query.error === 'branding'
    ? 'Check the short name and colors.'
    : query.error === 'email'
      ? 'Check the credit-union email address.'
      : '';
  const saved = query.saved ? NOTICES[query.saved] : '';
  const caution = query.notice ? NOTICES[query.notice] : '';
  const sourcePrimary = stored?.primary && /^#[0-9a-fA-F]{6}$/.test(stored.primary) ? stored.primary : tenant.brand.primary;
  const shareUrl = `https://signorwalk.com/cu/${tenant.id}`;
  const tabs: { id: Section; label: string }[] = [
    { id: 'usage', label: 'Usage' },
    { id: 'branding', label: 'Branding' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <header className="border-b cu-line">
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
          <AccountMenu tenant={tenant.id} linkClassName="cu-link text-[15px] font-semibold underline underline-offset-4 cu-linkline" />
        </div>
      </header>
      <nav className="border-b cu-line">
        <div className="mx-auto flex w-full max-w-[1120px] gap-6 px-4">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={`/cu/${tenant.id}/dashboard?section=${tab.id}`}
              className={`py-3 text-[15px] font-semibold ${section === tab.id ? 'cu-nav-active' : 'cu-muted'}`}
              aria-current={section === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        {saved ? <p className="cu-ok mb-6 rounded-lg px-4 py-3 text-[14px] font-semibold leading-[20px]" role="status">{saved}</p> : null}
        {caution ? <p className="cu-err mb-6 rounded-lg px-4 py-3 text-[14px] font-semibold leading-[20px]" role="status">{caution}</p> : null}
        {error ? <p className="cu-err mb-6 rounded-lg px-4 py-3 text-[14px] font-semibold leading-[20px]" role="alert">{error}</p> : null}

        {section === 'usage' ? <section aria-labelledby="usage-heading">
          <h1 id="usage-heading" className="text-[32px] font-bold leading-[38px]">Usage</h1>
          <p className="mt-4 text-[14px] leading-[20px] cu-muted">Since pilot start</p>
          <div className="mt-8 grid grid-cols-2 gap-6">
            <p>
              <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{aggregates.checks}</span>
              <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Checks</span>
            </p>
            <p>
              <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{aggregates.uploads}</span>
              <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Worksheet uploads</span>
            </p>
          </div>
          {aggregates.checks === 0 ? (
            <p className="mt-10 max-w-[560px] text-[15px] leading-[24px]">
              No checks yet. Share your link: <a href={shareUrl} className="cu-link underline underline-offset-4 cu-linkline">{shareUrl}</a>
            </p>
          ) : (
            <div className="mt-10">
              <table className="w-full max-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b cu-line text-[14px] leading-[20px] cu-muted">
                    <th className="py-3 pr-4 font-semibold">Grade</th>
                    <th className="py-3 text-right font-semibold">Count</th>
                    <th className="py-3 pl-4 text-right font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                    <tr key={grade} className="border-b cu-line text-[15px]">
                      <td className="py-3 pr-4">{grade}</td>
                      <td className="py-3 text-right tabular-nums">{aggregates.grades[grade]}</td>
                      <td className="py-3 pl-4 text-right tabular-nums">{Math.round((aggregates.grades[grade] / aggregates.checks) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <p className="text-[14px] leading-[20px] cu-muted">Off by default. Summaries contain counts only.</p>
            <label className="text-[14px] font-semibold leading-[20px]">Credit-union inbox
              <input name="notifyEmail" type="email" defaultValue={settings.notifyEmail ?? ''} autoComplete="off" className="mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal" />
            </label>
            <button type="submit" className="cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save settings</button>
          </form>
          <div className="mt-6">
            <p className="text-[14px] leading-[20px] cu-muted">Emails the counts to the credit-union inbox.</p>
            <form action={sendSummaryAction} className="mt-2">
              <input type="hidden" name="tenant" value={tenant.id} />
              <button type="submit" className="cu-link text-[15px] font-semibold underline decoration-1 underline-offset-4 cu-linkline">Send summary</button>
            </form>
          </div>
        </section> : null}
      </main>
    </>
  );
}
