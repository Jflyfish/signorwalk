import type { Metadata } from 'next';

export const metadata: Metadata = {
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

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
