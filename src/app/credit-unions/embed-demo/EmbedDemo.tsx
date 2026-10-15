'use client';

import { useEffect, useState } from 'react';
import { EMBED_COMPLETED, EMBED_RESIZE } from '@/cu/embed-client';

export function EmbedDemo() {
  const [height, setHeight] = useState<number | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; height?: unknown; grade?: unknown } | null;
      if (!data || typeof data !== 'object') return;
      if (data.type === EMBED_RESIZE && typeof data.height === 'number' && Number.isFinite(data.height)) {
        const frame = document.getElementById('sow-cu');
        if (frame) frame.style.height = `${data.height}px`;
        setHeight(data.height);
      }
      if (data.type === EMBED_COMPLETED && typeof data.grade === 'string' && /^[ABCDF]$/.test(data.grade)) {
        setGrade(data.grade);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <main className="mx-auto w-full max-w-[800px] px-4 py-10 md:py-16">
      <p className="text-[14px] font-semibold leading-[20px] cu-muted">Demo only</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">See the member check</h1>
      <p className="mt-6 text-[18px] leading-[28px]">
        This is the check a member would use, framed the way it sits on a credit union site. Harborlight Credit Union is fictional. Enter numbers from a worksheet. No application is taken, and this is not a rate or an offer of credit.
      </p>
      <p id="sow-embed-events" className="sr-only">
        Resize height: {height ?? '—'} · Completed grade: {grade ?? '—'}
      </p>
      <iframe
        id="sow-cu"
        title="Check a dealer offer"
        src="/cu/harborlight-cu/embed?entry=numbers"
        className="mt-8 w-full border cu-line"
        style={{ height: height ?? 720 }}
      />
    </main>
  );
}
