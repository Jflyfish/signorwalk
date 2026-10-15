import { AccountMenu } from './AccountMenu';

export function StaffHeader({
  tenant,
  children,
}: {
  tenant: string;
  children: React.ReactNode;
}) {
  return (
    <header className="border-b cu-line">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4">
        {children}
        <AccountMenu tenant={tenant} />
      </div>
    </header>
  );
}
