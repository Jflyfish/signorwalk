'use client';

import { useEffect } from 'react';
import type { DerivedBrand } from '@/cu/contrast';
import { completedMessage, isEmbedOrigin, resizeMessage } from '@/cu/embed';
import type { CuPublic } from '@/cu/tenants';
import { CheckForm } from '../CheckForm';

export function EmbedFrame({
  tenant,
  brand,
  targetOrigin,
}: {
  tenant: CuPublic;
  brand: DerivedBrand;
  targetOrigin: string | null;
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
    window.addEventListener('resize', post);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', post);
    };
  }, [targetOrigin]);

  return (
    <CheckForm
      tenant={tenant}
      brand={brand}
      embedded
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
