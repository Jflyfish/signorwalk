export function parseRgbChannels(channels: string): [number, number, number] {
  const parts = channels.trim().split(/\s+/).map(n => Number(n));
  if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB channels: ${channels}`);
  }
  return [parts[0], parts[1], parts[2]];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio. */
export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const INK: Rgb = [17, 17, 17];
const MIN_TEXT = 4.5;
/** Within the 6–10% band. */
const TINT_ALPHA = 0.08;

export interface BrandTokens {
  name: string;
  /** 24 characters maximum. */
  shortName: string;
  /** Hex color, for example #075985. */
  primary: string;
  secondary?: string;
  logoLight?: string;
  logoDark?: string;
  /** Width divided by height. */
  logoAspect: number;
  /** inter is self-hosted. serif is a system stack, so /cu makes no third-party font request. */
  font?: 'inter' | 'serif';
}

export interface DerivedBrand {
  name: string;
  shortName: string;
  primary: string;
  secondary?: string;
  logoLight?: string;
  logoDark?: string;
  logoAspect: number;
  font: 'inter' | 'serif';
  brandText: string;
  brandFill: string;
  onBrand: '#ffffff' | '#111111';
  hover: string;
  focus: string;
  tint: string;
  fallback: boolean;
}

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

function srgbToLinear(channel: number): number {
  return linearize(channel);
}

function linearToSrgb(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}

/** OKLCH as lightness 0–1, chroma, and hue degrees. */
export function rgbToOklch(rgb: Rgb): [number, number, number] {
  const [r, g, b] = rgb.map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToLinear(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut(linear: [number, number, number]): boolean {
  return linear.every(channel => channel >= -0.001 && channel <= 1.001);
}

export function oklchToRgb(L: number, C: number, H: number): Rgb {
  let chroma = Math.max(0, C);
  let linear = oklchToLinear(L, chroma, H);
  for (let i = 0; i < 16 && !inGamut(linear); i++) {
    chroma *= 0.8;
    linear = oklchToLinear(L, chroma, H);
  }
  if (!inGamut(linear)) linear = oklchToLinear(L, 0, H);
  return linear.map(linearToSrgb) as Rgb;
}

/** Chroma above 0.25 is capped at 0.18. Lower chroma is left as it is. */
export function capChroma(chroma: number): number {
  return chroma > 0.25 ? 0.18 : chroma;
}

function darkenForContrast(L: number, C: number, H: number, against: Rgb): Rgb | null {
  let lightness = L;
  for (let i = 0; i < 48; i++) {
    const rgb = oklchToRgb(lightness, C, H);
    if (contrastRatio(rgb, against) >= MIN_TEXT) return rgb;
    lightness -= 0.02;
    if (lightness < 0) break;
  }
  const floor = oklchToRgb(0, 0, H);
  return contrastRatio(floor, against) >= MIN_TEXT ? floor : null;
}

function fallbackBrand(tokens: BrandTokens, shortName: string): DerivedBrand {
  return {
    name: tokens.name,
    shortName,
    primary: '#111111',
    secondary: safeSecondary(tokens.secondary),
    logoLight: safeLogo(tokens.logoLight),
    logoDark: safeLogo(tokens.logoDark),
    logoAspect: safeAspect(tokens.logoAspect),
    font: tokens.font === 'serif' ? 'serif' : 'inter',
    brandText: '#111111',
    brandFill: '#111111',
    onBrand: '#ffffff',
    hover: '#000000',
    focus: '#111111',
    tint: 'rgb(17 17 17 / 0.08)',
    fallback: true,
  };
}

function safeSecondary(hex: string | undefined): string | undefined {
  const rgb = hex ? parseHex(hex) : null;
  return rgb ? rgbToHex(rgb) : undefined;
}

export function safeLogo(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.length > 300) return undefined;
  if (trimmed.startsWith('/cu-brand/') && !trimmed.includes('..')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

function safeAspect(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect < 0.2 || aspect > 8) return 1;
  return aspect;
}

function safeShortName(name: string, shortName: string): string {
  const trimmed = shortName.trim().replace(/\s+/g, ' ');
  const value = trimmed || name.trim();
  return [...value].slice(0, 24).join('');
}

/**
 * Brand colors used on the primary button, links, the focus ring, selected tiles, and the logo.
 * Anything that cannot meet 4.5:1 falls back to #111.
 */
export function deriveBrand(
  tenantId: string,
  tokens: BrandTokens,
  log: (line: string) => void = line => console.log(line),
): DerivedBrand {
  const shortName = safeShortName(tokens.name, tokens.shortName);
  const parsed = parseHex(tokens.primary);
  const fail = (reason: string): DerivedBrand => {
    log(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'brand-fallback',
      tenant: tenantId,
      reason,
    }));
    return fallbackBrand(tokens, shortName);
  };
  if (!parsed) return fail('invalid-primary');

  const [L, C, H] = rgbToOklch(parsed);
  if (!Number.isFinite(L) || !Number.isFinite(C) || !Number.isFinite(H)) return fail('invalid-primary');
  const chroma = capChroma(C);
  const capped = oklchToRgb(L, chroma, H);
  const text = darkenForContrast(L, chroma, H, WHITE);
  const fill = darkenForContrast(L, chroma, H, WHITE);
  if (!text || !fill) return fail('contrast');
  if (contrastRatio(text, WHITE) < MIN_TEXT || contrastRatio(WHITE, fill) < MIN_TEXT) return fail('contrast');

  const onBrand: '#ffffff' | '#111111' = contrastRatio(WHITE, fill) >= MIN_TEXT ? '#ffffff' : '#111111';
  if (contrastRatio(onBrand === '#ffffff' ? WHITE : INK, fill) < MIN_TEXT) return fail('contrast');

  const [fillL, fillC, fillH] = rgbToOklch(fill);
  const hover = oklchToRgb(Math.max(0, fillL * 0.92), fillC, fillH);
  return {
    name: tokens.name,
    shortName,
    primary: rgbToHex(capped),
    secondary: safeSecondary(tokens.secondary),
    logoLight: safeLogo(tokens.logoLight),
    logoDark: safeLogo(tokens.logoDark),
    logoAspect: safeAspect(tokens.logoAspect),
    font: tokens.font === 'serif' ? 'serif' : 'inter',
    brandText: rgbToHex(text),
    brandFill: rgbToHex(fill),
    onBrand,
    hover: rgbToHex(hover),
    focus: rgbToHex(text),
    tint: `rgb(${capped[0]} ${capped[1]} ${capped[2]} / ${TINT_ALPHA})`,
    fallback: false,
  };
}
