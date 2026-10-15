import { signOut } from './actions';

export function AccountMenu({ tenant, linkClassName }: { tenant: string; linkClassName: string }) {
  return (
    <details className="relative shrink-0">
      <summary className="cursor-pointer list-none text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        Account
      </summary>
      <div className="absolute right-0 z-10 mt-2 border cu-line bg-white px-4 py-3">
        <form action={signOut}>
          <input type="hidden" name="tenant" value={tenant} />
          <button type="submit" className={linkClassName}>Sign out</button>
        </form>
      </div>
    </details>
  );
}
