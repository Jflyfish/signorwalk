'use client';

export function DemoPage({ demo = false }: { demo?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] font-extrabold leading-[38px]">Your pre-approval page goes here</h1>
        {demo ? (
          <span className="inline-flex items-center rounded-full border cu-line px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
        ) : null}
      </div>
      <p className="mt-6 text-[18px] leading-[28px]">
        A live credit union sends members to its own pre-approval URL, which it sets in the dashboard.
      </p>
      <p className="mt-10">
        <a
          href="/credit-unions"
          className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring"
          onClick={event => {
            if (window.history.length > 1) {
              event.preventDefault();
              window.history.back();
            }
          }}
        >
          ← Back to the check
        </a>
      </p>
    </main>
  );
}
