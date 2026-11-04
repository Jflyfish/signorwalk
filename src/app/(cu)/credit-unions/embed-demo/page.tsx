import type { Metadata } from 'next';
import { EmbedDemo } from './EmbedDemo';

export const metadata: Metadata = {
  title: 'Embed demo',
  robots: { index: false, follow: false },
};

export default function EmbedDemoPage() {
  return <EmbedDemo />;
}
