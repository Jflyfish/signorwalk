import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Demo only — rates',
  robots: { index: false, follow: false },
};

export default function DemoRatesPage() {
  return (
    <DemoPage
      title="Demo only: auto rates"
      body="This sandbox stands in for a credit union rates page so the Harborlight demo link does not 404. No rate is published here."
    />
  );
}
