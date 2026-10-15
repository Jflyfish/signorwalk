import { TENANT_UNAVAILABLE } from '@/cu/tenant-directory';

export function Unavailable() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-16 md:py-24">
      <h1 className="text-[32px] font-bold leading-[38px]">Unavailable</h1>
      <p className="mt-4 text-[18px] leading-[28px] cu-muted">{TENANT_UNAVAILABLE}</p>
    </main>
  );
}
