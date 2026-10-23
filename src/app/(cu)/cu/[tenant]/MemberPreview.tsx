/** Real member page at phone width. Under 768px, a link instead of the frame. */
export function MemberPreview({ href, title }: { href: string; title: string }) {
  return (
    <>
      <a href={href} className="text-[15px] font-semibold underline underline-offset-4 cu-linkline md:hidden">
        Open your page
      </a>
      <iframe
        title={title}
        src={href}
        className="hidden h-[844px] w-[390px] max-w-full rounded-lg border cu-line bg-white md:block"
      />
    </>
  );
}
