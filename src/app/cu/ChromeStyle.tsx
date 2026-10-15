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
      .cu-ok { background-color: #f0fdf4; color: #14532d; }
      .cu-err { background-color: #fef2f2; color: #7f1d1d; }
      .cu-linkline { text-decoration-color: var(--cu-muted); }
      .cu-linkline:hover { text-decoration-color: var(--cu-ink); }
      .cu-ring:focus-visible { outline: 2px solid var(--cu-ink); outline-offset: 2px; }
      .cu-card { border: 1px solid var(--cu-line); transition: border-color 150ms, box-shadow 150ms; }
      .cu-card:hover { border-color: var(--cu-ink); box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
      .cu-card-marked { border-width: 2px; border-color: var(--cu-ink); }
    `}</style>
  );
}
