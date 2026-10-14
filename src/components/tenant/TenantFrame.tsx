'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import type { PublicTenant } from '@/tenants/types';
import { TenantLogo } from './Logo';

export function TenantFrame({ tenant, children }: { tenant: PublicTenant; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/analyze', label: 'Check an offer' },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:text-brand-accent focus:px-3 focus:py-2 focus:rounded-lg focus:shadow"
      >
        Skip to content
      </a>
      <header className="bg-brand-primary text-brand-fg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <TenantLogo logo={tenant.brand.logo} className="w-9 h-9 flex-shrink-0" />
            <span className="min-w-0">
              <span className="block font-bold text-base sm:text-lg tracking-tight truncate">{tenant.brand.name}</span>
              <span className="hidden sm:block text-xs text-brand-fg/80">{tenant.brand.tagline}</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1" aria-label="Primary">
            {links.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium px-3 py-1.5 rounded-lg text-brand-fg/90 hover:text-brand-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                {link.label}
              </Link>
            ))}
            <a href={tenant.brand.privacyUrl} className="text-sm font-medium px-3 py-1.5 rounded-lg text-brand-fg/90 hover:text-brand-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Privacy
            </a>
          </nav>
          <button
            type="button"
            className="sm:hidden w-10 h-10 rounded-lg text-brand-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(v => !v)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {open ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav id={panelId} className="sm:hidden border-t border-white/15 px-4 py-3 space-y-1" aria-label="Primary">
            {links.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block px-3 py-3 rounded-lg text-brand-fg font-medium hover:bg-white/10">
                {link.label}
              </Link>
            ))}
            <a href={tenant.brand.privacyUrl} className="block px-3 py-3 rounded-lg text-brand-fg font-medium hover:bg-white/10">
              Privacy
            </a>
          </nav>
        )}
      </header>

      <main id="main">{children}</main>

      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{tenant.brand.legalName}</span>
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Footer">
              <Link href="/analyze" className="text-brand-accent underline-offset-2 hover:underline">Check an offer</Link>
              <a href={tenant.brand.privacyUrl} className="text-brand-accent underline-offset-2 hover:underline">Privacy</a>
              <a href={tenant.brand.supportUrl} className="text-brand-accent underline-offset-2 hover:underline">Support</a>
            </nav>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Educational estimate only. Not an offer of credit and not financial, legal, or tax advice. Confirm every figure with the dealer. {tenant.brand.name} does not endorse any dealer.
          </p>
          <p className="text-xs text-gray-600">Powered by Sign or Walk, an independent provider.</p>
        </div>
      </footer>
      {tenant.id && <Analytics />}
    </>
  );
}
