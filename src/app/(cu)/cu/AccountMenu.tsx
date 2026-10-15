'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { signOut } from './actions';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={open ? 'rotate-180' : ''}>
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AccountMenu({ tenant }: { tenant: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[15px] font-semibold leading-[20px]"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(value => !value)}
      >
        Account
        <Chevron open={open} />
      </button>
      {open ? (
        <div id={menuId} className="absolute right-0 z-10 mt-2 rounded-lg border cu-line bg-white p-2">
          <form action={signOut}>
            <input type="hidden" name="tenant" value={tenant} />
            <button type="submit" className="block whitespace-nowrap text-left text-[15px] font-semibold leading-[20px] cu-ink">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
