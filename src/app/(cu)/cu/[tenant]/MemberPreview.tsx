/** Staff preview of the draft member page. Under 768px, a link instead of the frame. */
export function MemberPreview({ href, frameSrc, title }: { href: string; frameSrc: string; title: string }) {
  return (
    <>
      <a href={href} className="text-[15px] font-semibold underline underline-offset-4 cu-linkline md:hidden">
        Open your page
      </a>
      <iframe
        title={title}
        src={frameSrc}
        className="hidden h-[844px] w-[390px] max-w-full rounded-lg border cu-line bg-white md:block"
      />
    </>
  );
}
