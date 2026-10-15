const HIDE = `body > nav, body > footer { display: none !important; } body { background: #fff; }`;

export default function CreditUnionsNotFound() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-16">
      <style>{HIDE}</style>
      <h1 className="text-[32px] font-extrabold leading-[38px]">Page not found</h1>
    </main>
  );
}
