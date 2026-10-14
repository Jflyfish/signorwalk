import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blogPosts';
import { getRequestTenant } from '@/tenants/request';

export const dynamic = 'force-dynamic';

const BASE = 'https://signorwalk.com';

// Last meaningful change per route (git last-commit date of each page's source file).
// Fixed values so builds are deterministic and don't depend on git history in CI. Update when a page changes.
const LAST_MODIFIED = {
  home: '2026-06-23',
  analyze: '2026-06-28',
  blog: '2026-06-23',
  glossary: '2026-06-21',
  askAPro: '2026-06-23',
  negotiationSupport: '2026-05-22',
  about: '2026-06-23',
  contact: '2026-06-23',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getRequestTenant();
  if (!tenant.indexable) return [];

  const blogIndexDate = new Date(
    Math.max(new Date(LAST_MODIFIED.blog).getTime(), ...blogPosts.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t))),
  );

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(LAST_MODIFIED.home), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/analyze`, lastModified: new Date(LAST_MODIFIED.analyze), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: blogIndexDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/glossary`, lastModified: new Date(LAST_MODIFIED.glossary), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/ask-a-pro`, lastModified: new Date(LAST_MODIFIED.askAPro), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/negotiation-support`, lastModified: new Date(LAST_MODIFIED.negotiationSupport), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: new Date(LAST_MODIFIED.about), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(LAST_MODIFIED.contact), changeFrequency: 'monthly', priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
