import { AccountMenu } from './AccountMenu';

export function StaffHeader({
  tenant,
  accountLabel,
  children,
}: {
  tenant: string;
  accountLabel: string;
  children: React.ReactNode;
}) {
  return (
    <header className="border-b cu-line">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4">
        {children}
        <AccountMenu tenant={tenant} label={accountLabel} />
      </div>
    </header>
  );
}
