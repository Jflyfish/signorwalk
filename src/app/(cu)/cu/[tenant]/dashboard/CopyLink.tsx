'use client';

import { useId, useState } from 'react';

export function CopyLink({ url, text, label = 'Copy link' }: { url?: string; text?: string; label?: string }) {
  const value = text ?? url ?? '';
  const liveId = useId();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="cu-ring inline-flex h-12 items-center justify-center rounded-lg border cu-line bg-white px-4 text-[15px] font-semibold cu-ink md:h-11"
        aria-describedby={liveId}
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
          }).catch(() => {
            setCopied(false);
          });
        }}
      >
        {label}
      </button>
      <p id={liveId} aria-live="polite" className="mt-2 min-h-5 text-[14px] leading-[20px]">{copied ? 'Copied' : ''}</p>
    </div>
  );
}
