import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Negotiation Support — Sign or Walk',
  description: 'Get a word-for-word negotiation script built from your car deal. A former dealership insider tells you exactly what to say.',
  alternates: { canonical: 'https://signorwalk.com/negotiation-support' },
  openGraph: {
    title: 'Negotiation Support — Sign or Walk',
    description: 'Get a word-for-word negotiation script built from your car deal.',
    url: 'https://signorwalk.com/negotiation-support',
    type: 'website',
  },
};

export default function NegotiationSupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
