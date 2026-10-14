import { notFound } from 'next/navigation';
import { getCuTenant, toCuPublic } from '@/cu/tenants';
import { CheckForm } from './CheckForm';

export default async function CuPage({ params }: { params: Promise<{ tenant: string }> }) {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) notFound();
  return <CheckForm tenant={toCuPublic(tenant)} />;
}
