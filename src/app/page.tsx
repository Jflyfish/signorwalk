import type { Metadata } from 'next';
import ConsumerHome from '@/components/shell/ConsumerHome';
import { TenantHome } from '@/components/tenant/TenantHome';
import { homeMetadata } from '@/lib/tenant-metadata';
import { getRequestTenant } from '@/tenants/request';
import { toPublicTenant } from '@/tenants/public';

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata(await getRequestTenant());
}

export default async function Page() {
  const tenant = await getRequestTenant();
  if (tenant.id === 'sow') return <ConsumerHome />;
  return <TenantHome tenant={toPublicTenant(tenant)} />;
}
