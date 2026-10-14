import type { MetadataRoute } from 'next';
import { getRequestTenant } from '@/tenants/request';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getRequestTenant();
  if (!tenant.indexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://signorwalk.com/sitemap.xml',
  };
}
