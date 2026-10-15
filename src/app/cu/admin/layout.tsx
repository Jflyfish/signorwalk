export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cu-admin min-h-screen bg-white cu-ink">
      <style>{`
        .cu-admin :focus-visible { outline: 2px solid var(--cu-ink); outline-offset: 2px; }
        .cu-admin .cu-primary { background: var(--cu-ink); color: #fff; }
        .cu-admin .cu-primary:hover { background: #333; }
        .cu-admin .cu-link { color: var(--cu-ink); }
        .cu-admin .cu-nav-active { color: var(--cu-ink); border-bottom: 2px solid var(--cu-ink); }
        .cu-admin .cu-danger { background: #B42318; color: #fff; }
        .cu-admin .cu-danger:hover { background: #912018; }
        .cu-admin .cu-danger:focus-visible { outline: 2px solid #B42318; outline-offset: 2px; }
        .cu-admin .cu-danger-link { color: #B42318; }
      `}</style>
      {children}
    </div>
  );
}
