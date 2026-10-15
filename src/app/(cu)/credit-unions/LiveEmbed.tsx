'use client';

import { useEffect, useState } from 'react';
import { EMBED_COMPLETED, EMBED_RESIZE, resizeMessage } from '@/cu/embed-client';

/** Same-origin host for the member check. Height follows the embed's resize messages. */
export function LiveEmbed({
  src,
  title,
  frameId = 'sow-cu',
  onGrade,
}: {
  src: string;
  title: string;
  frameId?: string;
  onGrade?: (grade: string) => void;
}) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    function apply(next: number) {
      const frame = document.getElementById(frameId);
      if (frame) frame.style.height = `${next}px`;
      setHeight(next);
    }
    function onMessage(event: MessageEvent) {
      if (event.origin !== origin) return;
      const data = event.data as { type?: unknown; height?: unknown; grade?: unknown } | null;
      if (!data || typeof data !== 'object') return;
      if (data.type === EMBED_RESIZE && typeof data.height === 'number' && Number.isFinite(data.height) && data.height > 1) {
        apply(data.height);
      }
      if (data.type === EMBED_COMPLETED && typeof data.grade === 'string' && /^[ABCDF]$/.test(data.grade)) {
        onGrade?.(data.grade);
      }
    }
    function ping() {
      const frame = document.getElementById(frameId) as HTMLIFrameElement | null;
      try {
        frame?.contentWindow?.postMessage(resizeMessage(1), origin);
      } catch {
        return;
      }
    }
    window.addEventListener('message', onMessage);
    const timers = [0, 250, 1000].map(ms => window.setTimeout(ping, ms));
    return () => {
      window.removeEventListener('message', onMessage);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [frameId, onGrade]);

  return (
    <iframe
      id={frameId}
      title={title}
      src={src}
      className="mt-4 w-full border cu-line"
      style={{ height: height ?? 640 }}
    />
  );
}
