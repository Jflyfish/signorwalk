/**
 * Credit-union records only: profile, branding, settings, staff labels, and aggregate counts.
 * Member worksheets, images, extracted text, and deal numbers are not accepted.
 *
 * Vercel KV and Upstash Redis share a REST shape. With neither configured, the
 * process keeps an in-memory copy so `next build` still runs with no env vars.
 * Isolates do not share that copy.
 */

export interface StoredBranding {
  shortName?: string;
  primary?: string;
  secondary?: string;
  logoLight?: string;
  logoDark?: string;
  logoAspect?: number;
  font?: 'inter' | 'serif';
}

export interface StoredSettings {
  emailEnabled: boolean;
  /** Credit-union inbox. Never a member address collected from a worksheet. */
  notifyEmail?: string;
}

export interface GradeCounts {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface Aggregates {
  checks: number;
  uploads: number;
  grades: GradeCounts;
}

export interface StaffLabel {
  label: string;
  role: 'cu' | 'admin';
  tenantId: string;
}

const EMPTY_GRADES: GradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };

const memory = new Map<string, string>();

const BANNED = /sellingprice|msrp|vin|ssn|socialsecurity|dateofbirth|membername|worksheet|base64|password|monthlypayment|documenttext|imagebytes/i;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const LOGO_DATA = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/;

function assertCuRecord(value: unknown): void {
  const copy: Record<string, unknown> = value && typeof value === 'object'
    ? { ...(value as Record<string, unknown>) }
    : {};
  if (value && typeof value === 'object') {
    for (const key of ['logoLight', 'logoDark'] as const) {
      const logo = copy[key];
      if (typeof logo !== 'string' || !logo.startsWith('data:')) continue;
      if (!LOGO_DATA.test(logo) || logo.length > 500_000) {
        throw new Error('Credit-union storage cannot hold member data');
      }
      delete copy[key];
    }
  }
  const json = JSON.stringify(value && typeof value === 'object' ? copy : value);
  if (BANNED.test(json) || SSN.test(json)) {
    throw new Error('Credit-union storage cannot hold member data');
  }
}

function keyFor(tenantId: string, kind: string): string {
  return `cu:${kind}:${tenantId}`;
}

function restConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

async function restCommand(command: string[]): Promise<unknown> {
  const config = restConfig();
  if (!config) return undefined;
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('store-unavailable');
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

async function readRaw(key: string): Promise<string | null> {
  if (!restConfig()) return memory.get(key) ?? null;
  try {
    const result = await restCommand(['GET', key]);
    return typeof result === 'string' ? result : null;
  } catch {
    return memory.get(key) ?? null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  assertCuRecord(JSON.parse(value));
  memory.set(key, value);
  if (!restConfig()) return;
  try {
    await restCommand(['SET', key, value]);
  } catch {
    /* The in-memory copy still serves this isolate. */
  }
}

function emptyAggregates(): Aggregates {
  return { checks: 0, uploads: 0, grades: { ...EMPTY_GRADES } };
}

export async function getBranding(tenantId: string): Promise<StoredBranding | null> {
  const raw = await readRaw(keyFor(tenantId, 'branding'));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as StoredBranding;
  assertCuRecord(parsed);
  return parsed;
}

export async function saveBranding(tenantId: string, branding: StoredBranding): Promise<void> {
  assertCuRecord(branding);
  await writeRaw(keyFor(tenantId, 'branding'), JSON.stringify(branding));
}

export async function getSettings(tenantId: string): Promise<StoredSettings> {
  const raw = await readRaw(keyFor(tenantId, 'settings'));
  if (!raw) return { emailEnabled: false };
  const parsed = JSON.parse(raw) as StoredSettings;
  assertCuRecord(parsed);
  return { emailEnabled: parsed.emailEnabled === true, notifyEmail: parsed.notifyEmail };
}

export async function saveSettings(tenantId: string, settings: StoredSettings): Promise<void> {
  const stored: StoredSettings = {
    emailEnabled: settings.emailEnabled === true,
    notifyEmail: settings.notifyEmail?.trim() || undefined,
  };
  assertCuRecord(stored);
  await writeRaw(keyFor(tenantId, 'settings'), JSON.stringify(stored));
}

export async function getAggregates(tenantId: string): Promise<Aggregates> {
  const raw = await readRaw(keyFor(tenantId, 'aggregates'));
  if (!raw) return emptyAggregates();
  const parsed = JSON.parse(raw) as Aggregates;
  assertCuRecord(parsed);
  return {
    checks: Number(parsed.checks) || 0,
    uploads: Number(parsed.uploads) || 0,
    grades: { ...EMPTY_GRADES, ...parsed.grades },
  };
}

export async function recordCheck(tenantId: string, grade: keyof GradeCounts): Promise<void> {
  const current = await getAggregates(tenantId);
  current.checks += 1;
  current.grades[grade] += 1;
  assertCuRecord(current);
  await writeRaw(keyFor(tenantId, 'aggregates'), JSON.stringify(current));
}

export async function recordUpload(tenantId: string): Promise<void> {
  const current = await getAggregates(tenantId);
  current.uploads += 1;
  assertCuRecord(current);
  await writeRaw(keyFor(tenantId, 'aggregates'), JSON.stringify(current));
}

/** Labels only. Passwords stay in environment variables and are not stored. */
export function staffDirectory(): StaffLabel[] {
  const demo = (process.env.CU_DEMO_TENANT || 'harborlight-cu').trim().toLowerCase();
  return [
    { label: 'Demo credit union account', role: 'cu', tenantId: demo },
    { label: 'Sign or Walk admin', role: 'admin', tenantId: 'all' },
  ];
}

export function resetCuStore(): void {
  memory.clear();
}
