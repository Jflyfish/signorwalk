'use client';

import { useEffect, useState } from 'react';
import { EMBED_COMPLETED, EMBED_RESIZE } from '@/cu/embed';

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
    <main className="mx-auto w-full max-w-[800px] px-4 py-10">
      <p className="text-[14px] leading-[20px] cu-muted">Host page</p>
      <h1 className="mt-2 text-[32px] font-bold leading-[38px]">Harborlight embed</h1>
      <p id="sow-embed-events" className="mt-4 text-[15px] leading-[24px]">
        Resize height: {height ?? '—'} · Completed grade: {grade ?? '—'}
      </p>
      <iframe
        id="sow-cu"
        title="Check a dealer offer"
        src="/cu/harborlight-cu/embed"
        className="mt-6 w-full border cu-line"
        style={{ height: height ?? 720 }}
      />
    </main>
  );
}
