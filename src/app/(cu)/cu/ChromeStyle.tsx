/** Shared credit-union colors. Hex values live here, not in each page. */
export function ChromeStyle() {
  return (
    <style>{`
      :root {
        --cu-ink: #111;
        --cu-muted: #555;
        --cu-line: #E5E5E5;
        --cu-band: #FAFAFA;
      }
      .cu-ink { color: var(--cu-ink); }
      .cu-muted { color: var(--cu-muted); }
      .cu-line { border-color: var(--cu-line); }
      .cu-band { background-color: var(--cu-band); }
      .cu-solid { background-color: var(--cu-ink); color: #fff; }
      .cu-ok, .cu-err {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        border-radius: 8px;
        border-width: 1px;
        border-style: solid;
        padding: 12px 16px;
        font-size: 14px;
        line-height: 20px;
        font-weight: 600;
      }
      .cu-ok { border-color: #15803d; background: rgb(21 128 61 / 0.06); color: #15803d; }
      .cu-err { border-color: #b91c1c; background: rgb(185 28 28 / 0.06); color: #b91c1c; }
      .cu-ok svg, .cu-err svg { flex: none; margin-top: 2px; }
      .cu-linkline { text-decoration-color: var(--cu-muted); }
      .cu-linkline:hover { text-decoration-color: var(--cu-ink); }
      .cu-ring:focus-visible { outline: 2px solid var(--cu-ink); outline-offset: 2px; }
      .cu-card { border: 1px solid var(--cu-line); transition: border-color 150ms, box-shadow 150ms; }
      .cu-card:hover { border-color: var(--cu-ink); box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
      .cu-card-marked { border-width: 2px; border-color: var(--cu-ink); }
      .cu-print-only { display: none; }
      .cu-details-collapsed { display: none; }
      .cu-more-collapsed { display: none; }
      @media print {
        .cu-no-print, .cu-embed-attribution, .cu-pinned { display: none !important; }
        .cu-print-only, .cu-details-collapsed, .cu-more-collapsed { display: block !important; }
        .cu-figures { color: #555 !important; }
      }
    `}</style>
  );
}
