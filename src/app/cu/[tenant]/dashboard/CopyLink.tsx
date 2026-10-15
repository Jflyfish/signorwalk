'use client';

export function CopyLink({ url }: { url: string }) {
  return (
    <button
      type="button"
      className="mt-4 text-[15px] font-semibold underline decoration-1 underline-offset-4 cu-linkline cu-ink"
      onClick={() => {
        void navigator.clipboard.writeText(url).catch(() => undefined);
      }}
    >
      Copy link
    </button>
  );
}
