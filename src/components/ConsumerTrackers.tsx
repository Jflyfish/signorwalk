'use client';

import { usePathname } from 'next/navigation';

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

/** Consumer routes only. Credit-union CSP does not allow the Impact host. */
export function ConsumerTrackers() {
  const pathname = usePathname() ?? '';
  if (pathname === '/cu' || pathname.startsWith('/cu/') || pathname === '/credit-unions' || pathname.startsWith('/credit-unions/')) {
    return null;
  }
  return (
    <>
      {
        // @ts-expect-error -- Impact.com uses non-standard value attribute
        <meta name='impact-site-verification' value='e7de6a6f-016b-4648-9f9c-158540f33c60' />
      }
      <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7326631-016a-4fce-96e4-0cd9e935d1861.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');` }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
