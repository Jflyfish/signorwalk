export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cu-admin min-h-screen bg-white text-[#111]">
      <style>{`
        .cu-admin :focus-visible { outline: 2px solid #111; outline-offset: 2px; }
      `}</style>
      {children}
    </div>
  );
}
