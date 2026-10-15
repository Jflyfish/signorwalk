import type { Metadata } from 'next';
import { DemoPage } from '../DemoPage';

const title = 'Your auto rates page goes here';
const body = 'A live credit union sends members to its own rates URL, which it sets in the dashboard.';

export const metadata: Metadata = {
  title,
  description: body,
  robots: { index: false, follow: false },
};

export default function DemoRatesPage() {
  return <DemoPage demo title={title} body={body} />;
}
