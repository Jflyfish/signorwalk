import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CU_SESSION_COOKIE, demoTenantId, verifySession } from '@/cu/auth';
import { getAggregates, getSettings, staffDirectory } from '@/cu/cu-store';
import { CU_TENANTS } from '@/cu/tenants';
import { AccountMenu } from '../AccountMenu';

export const metadata: Metadata = {
  title: 'Credit unions — admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!session) redirect(`/cu/${demoTenantId()}/sign-in`);
  if (session.role !== 'admin') redirect(`/cu/${session.tenantId}/dashboard`);

  const rows = await Promise.all(CU_TENANTS.map(async tenant => ({
    tenant,
    aggregates: await getAggregates(tenant.id),
    settings: await getSettings(tenant.id),
  })));
  const checks = rows.reduce((sum, row) => sum + row.aggregates.checks, 0);
  const uploads = rows.reduce((sum, row) => sum + row.aggregates.uploads, 0);

  return (
    <>
      <header className="border-b cu-line">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4">
          <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
          <AccountMenu tenant={demoTenantId()} linkClassName="cu-ink text-[15px] font-semibold underline underline-offset-4 cu-linkline" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
        <h1 className="text-[32px] font-bold leading-[38px]">Credit unions</h1>
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
            <span className="mt-2 block text-[14px] leading-[20px] cu-muted">Tenants</span>
          </p>
        </div>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b cu-line text-[14px] leading-[20px] cu-muted">
                <th className="py-3 pr-4 font-semibold">Credit union</th>
                <th className="py-3 pr-4 font-semibold">Checks</th>
                <th className="py-3 pr-4 font-semibold">Uploads</th>
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 font-semibold">Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.tenant.id} className="border-b cu-line text-[15px] leading-[20px]">
                  <td className="py-3 pr-4">{row.tenant.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{row.aggregates.checks}</td>
                  <td className="py-3 pr-4 tabular-nums">{row.aggregates.uploads}</td>
                  <td className="py-3 pr-4">{row.settings.emailEnabled ? 'On' : 'Off'}</td>
                  <td className="py-3"><a className="font-semibold underline underline-offset-4 cu-linkline" href={`/cu/${row.tenant.id}/dashboard`}>{row.tenant.brand.shortName}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mt-10 text-[24px] font-bold leading-[30px]">Accounts</h2>
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="border-b cu-line text-[14px] leading-[20px] cu-muted">
              <th className="py-3 pr-4 font-semibold">Account</th>
              <th className="py-3 pr-4 font-semibold">Role</th>
              <th className="py-3 font-semibold">Tenant</th>
            </tr>
          </thead>
          <tbody>
            {staffDirectory().map(staff => (
              <tr key={staff.role} className="border-b cu-line text-[15px]">
                <td className="py-3 pr-4">{staff.label}</td>
                <td className="py-3 pr-4">{staff.role === 'admin' ? 'Admin' : 'Credit union'}</td>
                <td className="py-3">{staff.role === 'admin' ? 'All' : staff.tenantId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
