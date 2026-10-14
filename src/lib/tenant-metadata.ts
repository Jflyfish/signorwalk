import type { Metadata } from 'next';
import type { Tenant } from '@/tenants/types';

export const SOW_ROOT_METADATA: Metadata = {
  metadataBase: new URL('https://signorwalk.com'),
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI-powered car deal grader. Get an honest grade on your lease or finance deal — every red flag, every number, word-for-word negotiation script.',
  openGraph: {
    title: 'Sign or Walk — Know Before You Sign',
    description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
    type: 'website',
    url: 'https://signorwalk.com',
    siteName: 'Sign or Walk',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Sign or Walk — Know Before You Sign' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign or Walk — Know Before You Sign',
    description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
    images: ['/opengraph-image'],
  },
};

export const SOW_HOME_METADATA: Metadata = {
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI car deal grader. Paste in your numbers and get an honest grade, every red flag, and a word-for-word negotiation script.',
  alternates: { canonical: 'https://signorwalk.com' },
};

export const SOW_ANALYZE_METADATA: Metadata = {
  title: 'Grade My Car Deal — Free AI Deal Grader | Sign or Walk',
  description: 'Upload your lease or finance quote and get an A–F grade in 30 seconds. Every red flag, every number, word-for-word negotiation script. Free, always.',
  alternates: { canonical: 'https://signorwalk.com/analyze' },
  openGraph: {
    title: 'Grade My Car Deal — Free AI Deal Grader',
    description: 'Upload your lease or finance quote and get an A–F grade in 30 seconds.',
    url: 'https://signorwalk.com/analyze',
    type: 'website',
  },
};

function cuOrigin(tenant: Tenant): string {
  return `https://${tenant.hosts[0]}`;
}

export function rootMetadata(tenant: Tenant): Metadata {
  if (tenant.indexable) return SOW_ROOT_METADATA;
  const origin = cuOrigin(tenant);
  const title = `${tenant.brand.name} — Check a vehicle offer`;
  const description = `Educational comparison of a vehicle lease or finance offer for ${tenant.brand.name} members. Not an offer of credit.`;
  return {
    metadataBase: new URL(origin),
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: origin },
    openGraph: {
      title,
      description,
      type: 'website',
      url: origin,
      siteName: tenant.brand.name,
      images: [{ url: '/brand-og', width: 1200, height: 630, alt: `${tenant.brand.name} vehicle offer check` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand-og'],
    },
    icons: { icon: '/brand-icon', apple: '/brand-icon' },
  };
}

export function homeMetadata(tenant: Tenant): Metadata {
  if (tenant.indexable) return SOW_HOME_METADATA;
  const origin = cuOrigin(tenant);
  return {
    title: `${tenant.brand.name} — Check a vehicle offer`,
    description: `Compare the numbers on a lease or finance offer with typical benchmarks. Educational only. Not an offer of credit.`,
    robots: { index: false, follow: false },
    alternates: { canonical: origin },
  };
}

export function analyzeMetadata(tenant: Tenant): Metadata {
  if (tenant.indexable) return SOW_ANALYZE_METADATA;
  const origin = cuOrigin(tenant);
  return {
    title: `Check a vehicle offer — ${tenant.brand.name}`,
    description: 'Enter the numbers from a lease or finance worksheet. Educational comparison only. Not an offer of credit.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${origin}/analyze` },
  };
}
