import ConsumerAnalyze from '@/components/shell/ConsumerAnalyze';
import { TenantAnalyze } from '@/components/tenant/TenantAnalyze';
import { getRequestTenant } from '@/tenants/request';
import { toPublicTenant } from '@/tenants/public';

export default async function Page() {
  const tenant = await getRequestTenant();
  if (tenant.id === 'sow') return <ConsumerAnalyze />;
  return <TenantAnalyze tenant={toPublicTenant(tenant)} />;
}
