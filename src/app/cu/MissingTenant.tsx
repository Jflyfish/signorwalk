const HIDE = `body > nav, body > footer { display: none !important; } body { background: #fff; }`;

export function MissingTenant() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24">
      <style>{HIDE}</style>
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <h1 className="mt-16 text-[32px] font-extrabold leading-[38px] md:mt-24 md:text-[48px] md:leading-[52px]">Page not found</h1>
      <p className="mt-4 text-[18px] leading-[28px] cu-muted">This credit union page does not exist.</p>
      <p className="mt-6">
        <a
          href="https://signorwalk.com"
          className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring"
        >
          Go to signorwalk.com
        </a>
      </p>
    </main>
  );
}
