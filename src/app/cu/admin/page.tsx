import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CU_SESSION_COOKIE, demoTenantId, verifySession } from '@/cu/auth';
import { formatAuditLine, getAggregates, getBranding, getSettings, readAudit, type AuditLine } from '@/cu/cu-store';
import { resolveBrand } from '@/cu/brand';
import { getTenantProfile, listCreditUnions, STATUS_ACTIVE, STATUS_PAUSED, type ResolvedTenant } from '@/cu/tenant-directory';
import { StaffHeader } from '../StaffHeader';
import { OwnerEditor } from './OwnerEditor';

export const metadata: Metadata = {
  title: 'Credit unions — admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, string> = {
  branding: 'Branding saved.',
  profile: 'Profile saved.',
  settings: 'Settings saved.',
  paused: 'Paused.',
  resumed: 'Resumed.',
  removed: 'Removed.',
};

function noticeFor(query: { saved?: string; error?: string; removed?: string }): { tone: 'ok' | 'err'; text: string } | null {
  if (query.removed) return { tone: 'ok', text: NOTICES.removed };
  if (query.saved && NOTICES[query.saved]) return { tone: 'ok', text: NOTICES[query.saved] };
  if (query.error === 'branding') return { tone: 'err', text: 'Check the short name and colors.' };
  if (query.error === 'profile') return { tone: 'err', text: 'Check the name, links, and colors.' };
  if (query.error === 'settings') return { tone: 'err', text: 'Check the credit-union email and the embed origins.' };
  if (query.error === 'missing') return { tone: 'err', text: 'This credit union was not found.' };
  if (query.error === 'confirm') return { tone: 'err', text: 'Type the credit union id to remove it.' };
  return null;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ cu?: string; section?: string; confirm?: string; saved?: string; error?: string; removed?: string; need?: string }>;
}) {
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!session) redirect(`/cu/${demoTenantId()}/sign-in`);
  if (session.role !== 'admin') redirect(`/cu/${session.tenantId}/dashboard`);

  const query = await searchParams;
  const tenants = await listCreditUnions();
  const notice = noticeFor(query);
  const selected = query.cu && query.cu !== 'new' ? tenants.find(tenant => tenant.id === query.cu) : undefined;
  const usage = query.section === 'usage' && !query.cu;

  return (
    <>
      <StaffHeader tenant={demoTenantId()}>
        <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      </StaffHeader>
      <nav className="border-b cu-line">
        <div className="mx-auto flex w-full max-w-[1120px] gap-6 overflow-x-auto px-4">
          <a href="/cu/admin" className={`shrink-0 py-3 text-[15px] font-semibold ${usage ? 'cu-muted' : 'cu-nav-active'}`} aria-current={usage ? undefined : 'page'}>Credit unions</a>
          <a href="/cu/admin?section=usage" className={`shrink-0 py-3 text-[15px] font-semibold ${usage ? 'cu-nav-active' : 'cu-muted'}`} aria-current={usage ? 'page' : undefined}>Usage</a>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        {query.cu === 'new' ? <OwnerEditor mode="create" profile={null} shortName="" primary="#111111" secondary="" logoLight="" logoDark="" emailEnabled={false} notifyEmail="" notice={notice} /> : null}
        {query.cu && query.cu !== 'new' && !selected ? <p className="cu-err" role="alert">This credit union was not found.</p> : null}
        {selected && query.confirm === 'remove' ? (
          <OwnerEditor mode="confirm" profile={(await getTenantProfile(selected.id))!} shortName="" primary="" secondary="" logoLight="" logoDark="" emailEnabled={false} notifyEmail="" notice={notice} />
        ) : null}
        {selected && query.confirm === 'pause' ? (
          <OwnerEditor mode="pause" profile={(await getTenantProfile(selected.id))!} shortName="" primary="" secondary="" logoLight="" logoDark="" emailEnabled={false} notifyEmail="" notice={null} />
        ) : null}
        {selected && query.confirm !== 'remove' && query.confirm !== 'pause' ? <EditTenant tenant={selected} notice={notice} askForSite={query.need === 'site'} /> : null}
        {!query.cu && usage ? <Usage tenants={tenants} /> : null}
        {!query.cu && !usage ? <Directory tenants={tenants} notice={notice} audit={await readAudit()} /> : null}
      </main>
    </>
  );
}

async function EditTenant({
  tenant,
  notice,
  askForSite,
}: {
  tenant: ResolvedTenant;
  notice: { tone: 'ok' | 'err'; text: string } | null;
  askForSite: boolean;
}) {
  const profile = await getTenantProfile(tenant.id);
  if (!profile) return <p className="cu-err" role="alert">This credit union was not found.</p>;
  const brand = await resolveBrand(tenant);
  const settings = await getSettings(tenant.id);
  const stored = await getBranding(tenant.id);
  const sourcePrimary = stored?.primary && /^#[0-9a-fA-F]{6}$/.test(stored.primary) ? stored.primary : tenant.brand.primary;
  return (
    <OwnerEditor
      mode="edit"
      profile={profile}
      shortName={brand.shortName}
      primary={sourcePrimary}
      secondary={brand.secondary ?? ''}
      logoLight={brand.logoLight ?? ''}
      logoDark={brand.logoDark ?? ''}
      emailEnabled={settings.emailEnabled}
      notifyEmail={settings.notifyEmail ?? ''}
      notice={notice}
      askForSite={askForSite}
    />
  );
}

function Directory({
  tenants,
  notice,
  audit,
}: {
  tenants: ResolvedTenant[];
  notice: { tone: 'ok' | 'err'; text: string } | null;
  audit: AuditLine[];
}) {
  return (
    <>
      {notice ? <p className={`${notice.tone === 'ok' ? 'cu-ok' : 'cu-err'} mb-6`} role={notice.tone === 'ok' ? 'status' : 'alert'}>{notice.text}</p> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[32px] font-bold leading-[38px]">Credit unions</h1>
        <a href="/cu/admin?cu=new" className="cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Add credit union</a>
      </div>
      <DirectoryTable tenants={tenants} />
      {audit.length > 0 ? (
        <section className="mt-10" aria-labelledby="audit-heading">
          <h2 id="audit-heading" className="text-[24px] font-bold leading-[30px]">Audit</h2>
          <ul className="mt-4 max-w-full space-y-2 text-[14px] leading-[20px]">
            {audit.map(line => {
              const name = tenants.find(tenant => tenant.id === line.id)?.brand.shortName ?? line.id;
              return <li key={`${line.t}-${line.action}-${line.id}`}>{formatAuditLine(line, name)}</li>;
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}

async function DirectoryTable({ tenants }: { tenants: ResolvedTenant[] }) {
  const rows = await Promise.all(tenants.map(async tenant => ({
    tenant,
    aggregates: await getAggregates(tenant.id),
    settings: await getSettings(tenant.id),
  })));
  const checks = rows.reduce((sum, row) => sum + row.aggregates.checks, 0);
  const uploads = rows.reduce((sum, row) => sum + row.aggregates.uploads, 0);
  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{checks}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Checks</span>
        </p>
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{uploads}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Worksheet uploads</span>
        </p>
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{rows.length}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Credit unions</span>
        </p>
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b cu-line text-[14px] leading-[20px] cu-muted">
              <th className="py-3 pr-4 font-semibold">Credit union</th>
              <th className="py-3 pr-4 text-right font-semibold">Checks</th>
              <th className="hidden py-3 pr-4 text-right font-semibold md:table-cell">Uploads</th>
              <th className="hidden py-3 pr-4 font-semibold md:table-cell">Email</th>
              <th className="py-3 pr-4 font-semibold">Status</th>
              <th className="py-3 font-semibold">Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.tenant.id} className="border-b cu-line text-[15px] leading-[20px]">
                <td className="py-3 pr-4">{row.tenant.name}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{row.aggregates.checks}</td>
                <td className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{row.aggregates.uploads}</td>
                <td className="hidden py-3 pr-4 md:table-cell">{row.settings.emailEnabled ? 'On' : 'Off'}</td>
                <td className="py-3 pr-4">
                  <span className="md:hidden">{row.tenant.status === 'paused' ? 'Paused' : 'Active'}</span>
                  <span className="hidden md:inline">{row.tenant.status === 'paused' ? STATUS_PAUSED : STATUS_ACTIVE}</span>
                </td>
                <td className="py-3"><a className="font-semibold underline underline-offset-4 cu-linkline" href={`/cu/admin?cu=${row.tenant.id}`}>Edit</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function Usage({ tenants }: { tenants: ResolvedTenant[] }) {
  const rows = await Promise.all(tenants.map(async tenant => ({
    tenant,
    aggregates: await getAggregates(tenant.id),
  })));
  const checks = rows.reduce((sum, row) => sum + row.aggregates.checks, 0);
  const uploads = rows.reduce((sum, row) => sum + row.aggregates.uploads, 0);
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const row of rows) {
    for (const grade of ['A', 'B', 'C', 'D', 'F'] as const) grades[grade] += row.aggregates.grades[grade];
  }
  return (
    <section aria-labelledby="usage-heading">
      <h1 id="usage-heading" className="text-[32px] font-bold leading-[38px]">Usage</h1>
      <p className="mt-4 text-[14px] leading-[20px] cu-muted">All time</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{checks}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Checks</span>
        </p>
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{uploads}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Worksheet uploads</span>
        </p>
        <p>
          <span className="block text-[32px] font-bold leading-[32px] tabular-nums">{rows.length}</span>
          <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Credit unions</span>
        </p>
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-left md:min-w-[640px]">
          <thead>
            <tr className="border-b cu-line text-[14px] leading-[20px] cu-muted">
              <th className="py-3 pr-4 font-semibold">Credit union</th>
              <th className="py-3 pr-4 text-right font-semibold">Checks</th>
              <th className="hidden py-3 pr-4 text-right font-semibold md:table-cell">Uploads</th>
              {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                <th key={grade} className="hidden py-3 pr-4 text-right font-semibold md:table-cell">{grade}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.tenant.id} className="border-b cu-line text-[15px] leading-[20px]">
                <td className="py-3 pr-4">{row.tenant.name}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{row.aggregates.checks}</td>
                <td className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{row.aggregates.uploads}</td>
                {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                  <td key={grade} className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{row.aggregates.grades[grade]}</td>
                ))}
              </tr>
            ))}
            <tr className="text-[15px] font-semibold leading-[20px]">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4 text-right tabular-nums">{checks}</td>
              <td className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{uploads}</td>
              {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
                <td key={grade} className="hidden py-3 pr-4 text-right tabular-nums md:table-cell">{grades[grade]}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
