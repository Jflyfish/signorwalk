'use client';

export function CopyLink({ url, text, label = 'Copy link' }: { url?: string; text?: string; label?: string }) {
  const value = text ?? url ?? '';
  return (
    <button
      type="button"
      className="mt-4 text-[15px] font-semibold underline decoration-1 underline-offset-4 cu-linkline cu-ink"
      onClick={() => {
        void navigator.clipboard.writeText(value).catch(() => undefined);
      }}
    >
      {label}
    </button>
  );
}
