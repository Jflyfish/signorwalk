import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Your pre-approval page goes here',
  description: 'A live credit union sends members to its own pre-approval URL, which it sets in the dashboard.',
  robots: { index: false, follow: false },
};

export default function DemoPreapprovalPage() {
  return <DemoPage demo />;
}
