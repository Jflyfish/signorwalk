import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Demo only — help',
  robots: { index: false, follow: false },
};

export default function DemoHelpPage() {
  return (
    <DemoPage
      title="Demo only: help"
      body="This sandbox stands in for a credit union help page so the demo link does not 404. No request is taken here."
    />
  );
}
