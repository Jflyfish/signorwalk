export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cu-admin min-h-screen bg-white cu-ink">
      <style>{`
        .cu-admin :focus-visible { outline: 2px solid var(--cu-ink); outline-offset: 2px; }
      `}</style>
      {children}
    </div>
  );
}
