'use client';

import { useEffect } from 'react';
import type { DerivedBrand } from '@/cu/contrast';
import { EMBED_RESIZE, completedMessage, isEmbedOrigin, resizeMessage } from '@/cu/embed-client';
import type { CuPublic } from '@/cu/tenants';
import { CheckForm } from '../CheckForm';

export function EmbedFrame({
  tenant,
  brand,
  targetOrigin,
  numbersOnly = false,
  demoSample = false,
  disclosure,
  demoPage = false,
  sampleRun = false,
  sampleGrant = null,
}: {
  tenant: CuPublic;
  brand: DerivedBrand;
  targetOrigin: string | null;
  numbersOnly?: boolean;
  demoSample?: boolean;
  disclosure?: string;
  demoPage?: boolean;
  sampleRun?: boolean;
  sampleGrant?: string | null;
}) {
  useEffect(() => {
    if (!targetOrigin || !isEmbedOrigin(targetOrigin)) return;
    const origin = targetOrigin;
    const post = () => {
      if (window.parent === window) return;
      const root = document.getElementById('sow-embed-root');
      const height = root ? root.getBoundingClientRect().height : 0;
      if (!Number.isFinite(height) || height < 1) return;
      try {
        window.parent.postMessage(resizeMessage(height), origin);
      } catch {
        return;
      }
    };
    post();
    const root = document.getElementById('sow-embed-root');
    const observer = new ResizeObserver(() => post());
    if (root) observer.observe(root);
    const onPing = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as { type?: unknown } | null;
      if (data && data.type === EMBED_RESIZE) post();
    };
    window.addEventListener('message', onPing);
    window.addEventListener('resize', post);
    const timers = [250, 1000].map(ms => window.setTimeout(post, ms));
    return () => {
      observer.disconnect();
      window.removeEventListener('message', onPing);
      window.removeEventListener('resize', post);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [targetOrigin]);

  return (
    <CheckForm
      tenant={tenant}
      brand={brand}
      embedded
      numbersOnly={numbersOnly}
      demoSample={demoSample}
      disclosure={disclosure}
      demoPage={demoPage}
      sampleRun={sampleRun}
      sampleGrant={sampleGrant}
      onGrade={grade => {
        if (!targetOrigin || !isEmbedOrigin(targetOrigin) || window.parent === window) return;
        try {
          window.parent.postMessage(completedMessage(grade), targetOrigin);
        } catch {
          return;
        }
      }}
    />
  );
}
