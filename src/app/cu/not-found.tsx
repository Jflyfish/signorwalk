const HIDE = `body > nav, body > footer { display: none !important; } body { background: #fff; }`;

export default function CuNotFound() {
  return <style>{HIDE}</style>;
}
