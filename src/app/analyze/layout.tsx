import type { Metadata } from 'next';
import { analyzeMetadata } from '@/lib/tenant-metadata';
import { getRequestTenant } from '@/tenants/request';

export async function generateMetadata(): Promise<Metadata> {
  return analyzeMetadata(await getRequestTenant());
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
