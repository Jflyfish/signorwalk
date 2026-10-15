import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Your pre-approval page goes here',
  robots: { index: false, follow: false },
};

export default function DemoRatesPage() {
  return <DemoPage />;
}
