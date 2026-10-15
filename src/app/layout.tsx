import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
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

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sign or Walk',
    url: 'https://signorwalk.com',
    logo: 'https://signorwalk.com/icon',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sign or Walk',
    url: 'https://signorwalk.com',
    description: 'Free AI-powered car deal grader. Get an honest grade on your lease or finance deal — every red flag, every number, word-for-word negotiation script.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {
          // @ts-expect-error -- Impact.com uses non-standard value attribute
          <meta name='impact-site-verification' value='e7de6a6f-016b-4648-9f9c-158540f33c60' />
        }
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7326631-016a-4fce-96e4-0cd9e935d1861.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
