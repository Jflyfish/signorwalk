import type { Metadata } from 'next';
import Link from 'next/link';
import { PILOT_MARK } from '@/cu/copy';
import { OWNER_OPEN_ITEMS } from '@/cu/owner-open-items';
import { dueDiligenceDocs } from '@/cu/packet/documents';
import { DOCUMENT_VERSION_LABEL } from '../pricing';

export const metadata: Metadata = {
  title: 'Due-diligence packet — Sign or Walk',
  description: 'Draft packet for the credit-union pilot. Pending counsel review.',
  robots: { index: false, follow: false },
};

const link = 'font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export default function CreditUnionPacketPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <p className="mt-10 text-[14px] font-semibold leading-[20px]">{PILOT_MARK}</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">Due-diligence packet</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        {DOCUMENT_VERSION_LABEL}. This page describes the draft files. It is not a signed contract, not an audit, and not a certification. The download is a zip, not a PDF.
      </p>
      <p className="mt-6">
        <a href="/credit-unions/packet/download" className={link}>Download the zip ({DOCUMENT_VERSION_LABEL})</a>
      </p>
      <ul className="mt-10 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        {dueDiligenceDocs.map(doc => <li key={doc.slug}>{doc.title}</li>)}
      </ul>
      <h2 className="mt-10 text-[24px] font-bold leading-[30px]">The owner still has to supply</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        {OWNER_OPEN_ITEMS.map(item => <li key={item}>{item} — [To be completed — owner]</li>)}
      </ul>
      <p className="mt-10">
        <Link href="/credit-unions" className={link}>← Back to plans</Link>
      </p>
    </main>
  );
}
