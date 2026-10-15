import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

const BODY = 'This sandbox stands in for a credit union pre-approval page so the demo link does not 404. No application is taken here.';

export const metadata: Metadata = {
  title: 'Demo only — pre-approval',
  description: BODY,
  robots: { index: false, follow: false },
};

export default function DemoPreapprovalPage() {
  return (
    <DemoPage
      title="Demo only: pre-approval"
      body={BODY}
    />
  );
}
