import { notFound } from 'next/navigation';
import ConsumerAdvanced from '@/components/shell/ConsumerAdvanced';
import { getRequestTenant } from '@/tenants/request';

export default async function Page() {
  const tenant = await getRequestTenant();
  if (!tenant.features.documentUpload || !tenant.features.aiReport || !tenant.features.persistDeal) notFound();
  return <ConsumerAdvanced />;
}
