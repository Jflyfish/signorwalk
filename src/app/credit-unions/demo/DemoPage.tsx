import Link from 'next/link';
import { PILOT_MARK } from '@/cu/copy';

export function DemoPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <p className="text-[14px] font-semibold leading-[20px] cu-muted">Demo only</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">{title}</h1>
      <p className="mt-6 text-[18px] leading-[28px]">{body}</p>
      <p className="mt-6 text-[14px] leading-[20px] cu-muted">
        {PILOT_MARK}. This is not a credit union page, not a rate, and not an offer of credit. Harborlight Credit Union is a fictional demo.
      </p>
      <p className="mt-10">
        <Link href="/cu/harborlight-cu" className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring">
          Back to the Harborlight check
        </Link>
      </p>
    </main>
  );
}
