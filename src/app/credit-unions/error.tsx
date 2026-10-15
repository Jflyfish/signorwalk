'use client';

const HIDE = `body > nav, body > footer { display: none !important; } body { background: #fff; }`;

export default function CreditUnionsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-16">
      <style>{HIDE}</style>
      <h1 className="text-[32px] font-extrabold leading-[38px]">This page didn&apos;t load.</h1>
      <button type="button" onClick={() => reset()} className="mt-6 text-[15px] font-semibold underline underline-offset-4">
        Try again
      </button>
    </main>
  );
}
