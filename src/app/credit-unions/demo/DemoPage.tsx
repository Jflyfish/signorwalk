export function DemoPage({
  title,
  body,
  demo = false,
}: {
  title: string;
  body: string;
  demo?: boolean;
}) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] font-extrabold leading-[38px]">{title}</h1>
        {demo ? (
          <span className="inline-flex items-center rounded-full border cu-line px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
        ) : null}
      </div>
      <p className="mt-6 text-[18px] leading-[28px]">{body}</p>
      <p className="mt-10">
        <a
          href="/cu/harborlight-cu"
          className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring"
        >
          ← Back to the check
        </a>
      </p>
    </main>
  );
}
