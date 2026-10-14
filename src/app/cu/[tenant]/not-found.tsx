export default function CuTenantNotFound() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24">
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <h1 className="mt-16 text-[32px] font-extrabold leading-[38px] md:mt-24 md:text-[48px] md:leading-[52px]">Page not found</h1>
      <p className="mt-4 text-[18px] leading-[28px] text-[#555]">This credit union page does not exist.</p>
      <p className="mt-6">
        <a
          href="https://signorwalk.com"
          className="text-[15px] font-semibold text-[#111] underline decoration-[#555] decoration-1 underline-offset-4 hover:decoration-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
        >
          Go to signorwalk.com
        </a>
      </p>
    </main>
  );
}
