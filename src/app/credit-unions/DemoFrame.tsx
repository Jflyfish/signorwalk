'use client';

import { useEffect, useState } from 'react';
import { EMBED_RESIZE } from '@/cu/embed-client';

export function DemoFrame() {
  const [height, setHeight] = useState(720);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; height?: unknown } | null;
      if (!data || data.type !== EMBED_RESIZE || typeof data.height !== 'number' || !Number.isFinite(data.height)) return;
      setHeight(Math.min(1200, Math.max(480, Math.round(data.height))));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      title="Harborlight Credit Union demo check"
      src="/cu/harborlight-cu/embed"
      className="mt-6 w-full max-w-full rounded-lg border cu-line"
      style={{ height }}
    />
  );
}
