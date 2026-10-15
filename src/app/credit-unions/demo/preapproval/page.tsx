import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Demo only — pre-approval',
  robots: { index: false, follow: false },
};

export default function DemoPreapprovalPage() {
  return (
    <DemoPage
      title="Demo only: pre-approval"
      body="This sandbox stands in for a credit union pre-approval page so the Harborlight demo link does not 404. No application is taken here."
    />
  );
}
