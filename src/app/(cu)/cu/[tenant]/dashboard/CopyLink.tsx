'use client';

export function CopyLink({ url, text, label = 'Copy link' }: { url?: string; text?: string; label?: string }) {
  const value = text ?? url ?? '';
  return (
    <button
      type="button"
      className="cu-ring mt-4 inline-flex h-12 items-center justify-center rounded-lg border cu-line bg-white px-4 text-[15px] font-semibold cu-ink md:h-11"
      onClick={() => {
        void navigator.clipboard.writeText(value).catch(() => undefined);
      }}
    >
      {label}
    </button>
  );
}
