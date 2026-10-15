import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

const title = 'Your privacy page goes here';
const body = 'A live credit union sends members to its own privacy URL, which it sets in the dashboard.';

export const metadata: Metadata = {
  title,
  description: body,
  robots: { index: false, follow: false },
};

export default function DemoPrivacyPage() {
  return <DemoPage title={title} body={body} />;
}
