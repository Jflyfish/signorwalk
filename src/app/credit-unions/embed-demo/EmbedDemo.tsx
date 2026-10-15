'use client';

import { useState } from 'react';
import { LiveEmbed } from '../LiveEmbed';

export function EmbedDemo() {
  const [grade, setGrade] = useState<string | null>(null);

  return (
    <main className="mx-auto w-full max-w-[800px] px-4 py-10 md:py-16">
      <p className="text-[14px] font-semibold leading-[20px] cu-muted">Demo only</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">See the member check</h1>
      <p className="mt-6 text-[18px] leading-[28px]">
        This is the check a member would use, framed the way it sits on a credit union site. Harborlight Credit Union is fictional. Enter numbers from a worksheet. No application is taken, and this is not a rate or an offer of credit.
      </p>
      <p id="sow-embed-events" className="sr-only">
        Completed grade: {grade ?? '—'}
      </p>
      <LiveEmbed
        title="Check a dealer offer"
        src="/cu/harborlight-cu/embed?entry=numbers"
        onGrade={setGrade}
      />
    </main>
  );
}
