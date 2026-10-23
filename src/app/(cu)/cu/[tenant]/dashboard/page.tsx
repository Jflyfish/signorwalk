import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { resolveBrand } from '@/cu/brand';
import { getBranding, getSettings, getTenantCounters, resetHarborlightPreviewCounters } from '@/cu/cu-store';
import { TALK_TO_US_EMAIL } from '@/app/(cu)/credit-unions/pricing';
import { deepLink, iframeSnippet, memberOrigin } from '@/cu/embed';
import { loadCuTenant } from '@/cu/tenant-directory';
import { resendConfirmAction, saveEmbedOriginsAction, saveLoanLinksAction, saveSettingsAction, sendSummaryAction } from '../../actions';
import { BrandLockup } from '../../BrandLockup';
import { StaffHeader } from '../../StaffHeader';
import { MemberPreview } from '../MemberPreview';
import { BrandingForm } from './BrandingForm';
import { CopyLink } from './CopyLink';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

type Section = 'usage' | 'branding' | 'settings' | 'embed';

function sectionFrom(query: { section?: string; saved?: string; error?: string; notice?: string }): Section {
  if (query.section === 'branding' || query.section === 'settings' || query.section === 'usage' || query.section === 'embed') return query.section;
  if (query.saved === 'branding' || query.error === 'branding') return 'branding';
  if (query.saved === 'origins' || query.error === 'origins') return 'embed';
  const stay = query.notice === 'confirm' || query.notice === 'sent' || query.notice === 'mail';
  if (query.saved === 'settings' || query.saved === 'email' || query.error === 'email' || (query.notice && !stay)) return 'settings';
  return 'usage';
}

function trialDaysLeft(iso: string, now = Date.now()): number | null {
  const ends = Date.parse(iso);
  if (!Number.isFinite(ends)) return null;
  if (ends <= now) return 0;
  return Math.ceil((ends - now) / 86_400_000);
}

function AlertIcon({ tone }: { tone: 'ok' | 'err' }) {
  return tone === 'ok' ? (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8.2l2 2 4-4.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.8v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

function Alert({ tone, children }: { tone: 'ok' | 'err'; children: string }) {
  return (
    <p className={`${tone === 'ok' ? 'cu-ok' : 'cu-err'} mb-6`} role={tone === 'ok' ? 'status' : 'alert'}>
      <AlertIcon tone={tone} />
      <span>{children}</span>
    </p>
  );
}

const NOTICES: Record<string, string> = {
  settings: 'Settings saved.',
  branding: 'Branding saved.',
  email: 'Summary sent.',
  confirmed: 'Trial confirmed.',
  origins: 'Website saved.',
  links: 'Links saved.',
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
  const tenant = await loadCuTenant((await params).tenant);
  if (!tenant) notFound();
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant.id)) redirect(`/cu/${tenant.id}/sign-in`);
  const brand = await resolveBrand(tenant);
  await resetHarborlightPreviewCounters();
  const counters = await getTenantCounters(tenant.id);
  const settings = await getSettings(tenant.id);
  const stored = await getBranding(tenant.id);
  const query = await searchParams;
  const section = sectionFrom(query);
  const error = query.error === 'branding'
    ? 'Check the short name and colors.'
    : query.error === 'email'
      ? 'Check the credit-union email address.'
        : query.error === 'origins'
        ? 'Use one https origin per line.'
          : query.error === 'links'
          ? 'Use a link that starts with https://'
          : '';
  const saved = query.saved ? NOTICES[query.saved] : query.notice === 'sent' ? 'Confirmation email sent.' : '';
  const caution = query.notice === 'mail'
    ? 'Email is not configured on this server.'
    : query.notice && query.notice !== 'confirm' && query.notice !== 'sent' ? NOTICES[query.notice] : '';
  const trialDays = tenant.trialEndsAt ? trialDaysLeft(tenant.trialEndsAt) : null;
  const sourcePrimary = stored?.primary && /^#[0-9a-fA-F]{6}$/.test(stored.primary) ? stored.primary : tenant.brand.primary;
  const requestHeaders = await headers();
  const origin = memberOrigin(name => requestHeaders.get(name), process.env.VERCEL_URL);
  const shareUrl = `${origin}/cu/${tenant.id}`;
  const previewUrl = `${origin}/cu/${tenant.id}/preview`;
  const embedUrl = deepLink(tenant.id, origin);
  const snippet = iframeSnippet(tenant.id, origin);
  const tabs: { id: Section; label: string }[] = [
    { id: 'usage', label: 'Usage' },
    { id: 'branding', label: 'Branding' },
    { id: 'settings', label: 'Settings' },
    { id: 'embed', label: 'Embed' },
  ];

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
      <nav className="border-b cu-line">
        <div className="mx-auto flex w-full max-w-[1120px] gap-6 overflow-x-auto px-4">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={`/cu/${tenant.id}/dashboard?section=${tab.id}`}
              className={`shrink-0 py-3 text-[15px] font-semibold ${section === tab.id ? 'cu-nav-active' : 'cu-muted'}`}
              aria-current={section === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>
      {query.saved === 'confirmed' && tenant.loanLinksSet === false ? (
        <div className="sticky top-0 z-20 border-b cu-line bg-white px-4 py-3">
          <p className="mx-auto w-full max-w-[1120px] text-[15px] font-semibold leading-[24px]">
            Set the loan application URL before you share the member link.
          </p>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        {!tenant.verified ? (
          <form action={resendConfirmAction} className="mb-6 max-w-[560px] rounded-lg border cu-line p-4">
            <input type="hidden" name="tenant" value={tenant.id} />
            <p className="text-[14px] leading-[20px]">Check your email to confirm</p>
            <button type="submit" className="cu-link mt-4 text-[15px] font-semibold underline decoration-1 underline-offset-4 cu-linkline">Resend link</button>
          </form>
        ) : null}
        {trialDays !== null ? (
          <p className="mb-6 text-[14px] leading-[20px]">
            Trial: {trialDays} {trialDays === 1 ? 'day' : 'days'} left. <a href={`mailto:${TALK_TO_US_EMAIL}`} className="font-semibold underline underline-offset-4 cu-linkline">Email us</a> to upgrade.
          </p>
        ) : null}
        {section === 'usage' ? (
          <section aria-labelledby="member-link-heading" className="mb-10 max-w-[560px] text-left">
            <h1 id="member-link-heading" className="text-[32px] font-bold leading-[38px]">Your member link</h1>
            <p className="mt-4 text-[15px] leading-[24px]">Share this page with members. They enter the numbers from a dealer worksheet.</p>
            <p className="mt-4 break-all text-[15px] leading-[24px]">
              <a href={shareUrl} className="underline underline-offset-4 cu-linkline">{shareUrl}</a>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyLink text={shareUrl} label="Copy link" />
              <CopyLink text={snippet} label="Copy embed" />
            </div>
            <p className="mt-4 text-[14px] leading-[20px] cu-muted">The embed loads only on a domain in this credit union&apos;s allowlist.</p>
            <div className="mt-6">
              <MemberPreview href={shareUrl} frameSrc={previewUrl} title={`${tenant.name} page`} />
            </div>
          </section>
        ) : null}
        {section === 'usage' && tenant.loanLinksSet === false ? (
          <form action={saveLoanLinksAction} className="mb-10 grid max-w-[560px] gap-4">
            <h2 className="text-[24px] font-bold leading-[30px]">Pre-approval and rates</h2>
            <p className="text-[14px] leading-[20px] cu-muted">Add the credit union&apos;s own pages. These fields start empty.</p>
            <label className="text-[14px] font-semibold leading-[20px]">Pre-approval URL
              <input name="preApprovalUrl" type="url" inputMode="url" autoComplete="off" spellCheck={false} className="cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal" />
            </label>
            <label className="text-[14px] font-semibold leading-[20px]">Rates URL (optional)
              <input name="ratesUrl" type="url" inputMode="url" autoComplete="off" spellCheck={false} className="cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal" />
            </label>
            <input type="hidden" name="tenant" value={tenant.id} />
            <button type="submit" className="cu-primary cu-ring inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save links</button>
          </form>
        ) : null}
        {tenant.verified && tenant.embedOrigins.length === 0 ? (
          <form action={saveEmbedOriginsAction} className="mb-6 grid max-w-[560px] gap-4">
            <input type="hidden" name="tenant" value={tenant.id} />
            <label htmlFor="embed-allowlist" className="text-[14px] font-semibold leading-[20px]">Add website
              <span className="mt-2 block font-normal cu-muted">Add at least one website that can show the tool.</span>
              <textarea id="embed-allowlist" name="embedOrigins" rows={3} className="cu-ring mt-2 block w-full rounded-lg border cu-line px-4 py-3 text-[16px] font-normal" />
            </label>
            <button type="submit" className={`${section === 'usage' && tenant.loanLinksSet === false ? 'inline-flex h-12 w-full items-center justify-center rounded-lg border cu-line bg-white px-4 text-[15px] font-semibold cu-ink md:h-11 md:w-auto' : 'cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto'}`}>Save website</button>
          </form>
        ) : null}
        {saved ? <Alert tone="ok">{saved}</Alert> : null}
        {caution ? <Alert tone="err">{caution}</Alert> : null}
        {error ? <Alert tone="err">{error}</Alert> : null}

        {section === 'usage' ? <section aria-labelledby="usage-heading">
          <h2 id="usage-heading" className="text-[24px] font-bold leading-[30px]">Usage</h2>
          <p className="mt-4 text-[14px] leading-[20px] cu-muted">All time</p>
          <p className="mt-8">
            <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{counters.gradesRun}</span>
            <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Grades run</span>
          </p>
          <p className="mt-4 text-[14px] leading-[20px] cu-muted">Grades describe offers, not members.</p>
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

        {section === 'embed' ? <section aria-labelledby="embed-heading">
          <h1 id="embed-heading" className="text-[32px] font-bold leading-[38px]">Embed</h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-[24px]">Place the check on your site or in your app. The page uses your brand and leaves out the marketing navigation. The embed loads only on a domain in this credit union&apos;s allowlist.</p>

          <h2 className="mt-10 text-[24px] font-bold leading-[30px]">Iframe</h2>
          <p className="mt-2 max-w-[560px] text-[14px] leading-[20px] cu-muted">Paste this on a page whose origin is on your allowlist. The script sets the height from signorwalk.cu.resize.</p>
          <pre className="mt-4 max-w-full whitespace-pre overflow-x-auto rounded-lg border cu-line bg-[#FAFAFA] p-4 font-mono text-[14px] leading-[20px]">{snippet}</pre>
          <CopyLink text={snippet} label="Copy snippet" />

          <h2 className="mt-10 text-[24px] font-bold leading-[30px]">App deep link</h2>
          <p className="mt-2 max-w-[560px] text-[14px] leading-[20px] cu-muted">Open this URL in a WKWebView or Android WebView.</p>
          <p className="mt-2 max-w-[560px] break-all text-[14px] leading-[20px]">
            <a href={embedUrl} className="underline underline-offset-4 cu-linkline">{embedUrl}</a>
          </p>
          <CopyLink url={embedUrl} />

          <h2 className="mt-10 text-[24px] font-bold leading-[30px]">Web, iOS, and Android</h2>
          <ul className="mt-4 max-w-[560px] list-disc space-y-4 pl-4 text-[15px] leading-[24px]">
            <li>Web: use the iframe on an allowlisted origin. Listen for signorwalk.cu.resize and signorwalk.cu.completed.</li>
            <li>iOS: load the deep link as the WKWebView document, or iframe it from a page you host and read the same messages there.</li>
            <li>Android: load the deep link in a WebView with JavaScript on, or iframe it from a page you host.</li>
          </ul>
          <p className="mt-4 max-w-[560px] text-[15px] leading-[24px]">The completed event only includes the grade (A–F).</p>
          <p className="mt-4 max-w-[560px] text-[14px] leading-[20px] cu-muted">Check that event.origin is {origin} before reading a message. A framed local copy is at /credit-unions/embed-demo.</p>
        </section> : null}
      </main>
    </>
  );
}
