import { OWNER_BLANK_MARK, OWNER_BLANK_NOTE, OWNER_OPEN_ITEMS } from '@/cu/owner-open-items';

export function OwnerOpenList() {
  return (
    <>
      <p className="mt-4 text-[14px] leading-[20px] cu-muted">{OWNER_BLANK_NOTE}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        {OWNER_OPEN_ITEMS.map(item => (
          <li key={item}>
            {item}
            {' — '}
            <span className="text-[14px] leading-[20px] cu-muted">{OWNER_BLANK_MARK}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
