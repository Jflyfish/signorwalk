import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

const BODY = 'This sandbox stands in for a credit union rates page so the demo link does not 404. No rate is published here.';

export const metadata: Metadata = {
  title: 'Demo only — rates',
  description: BODY,
  robots: { index: false, follow: false },
};

export default function DemoRatesPage() {
  return (
    <DemoPage
      title="Demo only: auto rates"
      body={BODY}
    />
  );
}
