import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

export const metadata: Metadata = {
  title: 'Demo only — privacy',
  robots: { index: false, follow: false },
};

export default function DemoPrivacyPage() {
  return (
    <DemoPage
      title="Demo only: privacy"
      body="This sandbox stands in for a credit union privacy page so the demo link does not 404. It is not a privacy policy. The pilot draft is linked from the credit union plans page."
    />
  );
}
