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

/** Two integers. No inputs, grades, addresses, or timestamps. */
export interface TenantCounters {
  gradesRun: number;
  loanClicks: number;
}

export interface StaffLabel {
  label: string;
  role: 'cu' | 'admin';
  tenantId: string;
}

const EMPTY_GRADES: GradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };

const globalStore = globalThis as typeof globalThis & {
  __sowCuStore?: Map<string, string>;
  __sowFrameAncestors?: Map<string, { value: string; exp: number }>;
};
const memory = globalStore.__sowCuStore ?? new Map<string, string>();
globalStore.__sowCuStore = memory;
const frameCache = globalStore.__sowFrameAncestors ?? new Map<string, { value: string; exp: number }>();
globalStore.__sowFrameAncestors = frameCache;

/** Set when a configured KV read fails. CSP must not treat memory or config seeds as that read. */
let storeUnavailable = false;

export function cuStoreUnavailable(): boolean {
  return storeUnavailable;
}

export function markCuStoreUnavailable(): void {
  storeUnavailable = true;
}

export function readFrameAncestorCache(id: string, now: number): string | undefined {
  const hit = frameCache.get(id);
  if (!hit || hit.exp <= now) return undefined;
  return hit.value;
}

export function writeFrameAncestorCache(id: string, value: string, exp: number): void {
  frameCache.set(id, { value, exp });
}

export function clearFrameAncestorCache(id?: string): void {
  if (id) frameCache.delete(id);
  else frameCache.clear();
}

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
    storeUnavailable = false;
    return typeof result === 'string' ? result : null;
  } catch {
    storeUnavailable = true;
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

function counterKey(tenantId: string, field: keyof TenantCounters): string {
  return `cu:${field}:${tenantId}`;
}

function whole(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n >= 0 && n < 1_000_000_000 ? n : 0;
}

async function readInteger(key: string): Promise<number> {
  if (!restConfig()) return whole(memory.get(key) ?? 0);
  try {
    const result = await restCommand(['GET', key]);
    storeUnavailable = false;
    if (typeof result === 'number' || typeof result === 'string') return whole(result);
    return 0;
  } catch {
    storeUnavailable = true;
    return 0;
  }
}

/** One INCR. No read before the write. Throws when the configured store rejects it. */
async function incrInteger(key: string): Promise<void> {
  if (!/^cu:(?:gradesRun|loanClicks):[a-z0-9-]+$/.test(key)) return;
  if (restConfig()) {
    const result = await restCommand(['INCR', key]);
    const n = Number(result);
    if (!Number.isInteger(n) || n < 1) throw new Error('store-unavailable');
    memory.set(key, String(n));
    return;
  }
  const current = whole(memory.get(key) ?? 0);
  memory.set(key, String(current + 1));
}

export async function getTenantCounters(tenantId: string): Promise<TenantCounters> {
  const [gradesRun, loanClicks] = await Promise.all([
    readInteger(counterKey(tenantId, 'gradesRun')),
    readInteger(counterKey(tenantId, 'loanClicks')),
  ]);
  return { gradesRun, loanClicks };
}

/** Grades run. One atomic increment. */
export function recordGradeRun(tenantId: string): Promise<void> {
  return incrInteger(counterKey(tenantId, 'gradesRun'));
}

/** Loan-application clicks. One atomic increment. */
export function recordLoanClick(tenantId: string): Promise<void> {
  return incrInteger(counterKey(tenantId, 'loanClicks'));
}

const HARBORLIGHT_PREVIEW_RESET = 'cu:preview-reset:harborlight-cu';

/**
 * Zeros Harborlight's preview counters once.
 * Runs only when VERCEL_ENV is preview. Production KV is never written.
 */
export async function resetHarborlightPreviewCounters(): Promise<void> {
  if (process.env.VERCEL_ENV !== 'preview') return;
  try {
    const marker = await readRaw(HARBORLIGHT_PREVIEW_RESET);
    if (marker === 'qa-r9') return;
    const id = 'harborlight-cu';
    for (const field of ['gradesRun', 'loanClicks'] as const) {
      const key = counterKey(id, field);
      memory.set(key, '0');
      if (restConfig()) await restCommand(['SET', key, '0']);
    }
    memory.delete(keyFor(id, 'counters'));
    if (restConfig()) await restCommand(['DEL', keyFor(id, 'counters')]);
    await writeRaw(keyFor(id, 'aggregates'), JSON.stringify(emptyAggregates()));
    memory.set(HARBORLIGHT_PREVIEW_RESET, 'qa-r9');
    if (restConfig()) await restCommand(['SET', HARBORLIGHT_PREVIEW_RESET, 'qa-r9']);
  } catch {
    /* A failed preview reset must not block the page. */
  }
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

export async function readStoreJson<T>(key: string): Promise<T | null> {
  const raw = await readRaw(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as T;
  assertCuRecord(parsed);
  return parsed;
}

export async function writeStoreJson(key: string, value: unknown): Promise<void> {
  assertCuRecord(value);
  await writeRaw(key, JSON.stringify(value));
}

export async function deleteStoreKey(key: string): Promise<void> {
  memory.delete(key);
  if (!restConfig()) return;
  try {
    await restCommand(['DEL', key]);
  } catch {
    /* The in-memory copy already dropped the key. */
  }
}

export async function deleteTenantData(tenantId: string): Promise<void> {
  for (const kind of ['profile', 'branding', 'settings', 'aggregates', 'counters', 'gradesRun', 'loanClicks']) {
    await deleteStoreKey(keyFor(tenantId, kind));
  }
}

export function storeKey(tenantId: string, kind: string): string {
  return keyFor(tenantId, kind);
}

/** One line: time, action, credit-union id, and who saved it. No emails or origins. */
export interface AuditLine {
  t: string;
  action: string;
  id: string;
  who: 'owner' | 'tenant';
}

const AUDIT_KEY = 'cu:directory:audit';
const AUDIT_VERBS: Record<string, string> = {
  create: 'Added',
  profile: 'Updated',
  branding: 'Branded',
  settings: 'Updated',
  pause: 'Paused',
  resume: 'Resumed',
  remove: 'Removed',
};
const AUDIT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatAuditLine(line: Pick<AuditLine, 't' | 'action' | 'who'>, name: string): string {
  const date = new Date(line.t);
  const when = Number.isNaN(date.getTime())
    ? line.t
    : `${AUDIT_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  const verb = AUDIT_VERBS[line.action] ?? line.action;
  const who = line.who === 'tenant' ? 'by tenant' : 'by owner';
  return `${when} · ${verb} ${name} · ${who}`;
}

export async function appendAudit(action: string, id: string, who: 'owner' | 'tenant' = 'owner'): Promise<void> {
  if (!/^[a-z]{3,16}$/.test(action) || !/^[a-z0-9-]+$/.test(id)) return;
  if (who !== 'owner' && who !== 'tenant') return;
  try {
    const current = (await readStoreJson<AuditLine[]>(AUDIT_KEY)) ?? [];
    const next = [...current, { t: new Date().toISOString(), action, id, who }].slice(-40);
    await writeStoreJson(AUDIT_KEY, next);
  } catch {
    /* A rejected line is dropped. The owner action still completes. */
  }
}

export async function readAudit(): Promise<AuditLine[]> {
  try {
    const parsed = await readStoreJson<AuditLine[]>(AUDIT_KEY);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(line => (
      Boolean(line)
      && typeof line.t === 'string'
      && typeof line.action === 'string'
      && typeof line.id === 'string'
      && (line.who === 'owner' || line.who === 'tenant')
    ));
  } catch {
    return [];
  }
}

export function resetCuStore(): void {
  memory.clear();
  frameCache.clear();
  storeUnavailable = false;
}

/**
 * Atomic fixed window for signup. Returns null when KV is unset or the call fails,
 * so the caller can use a process-local fallback. A failure here does not mark the
 * store unavailable: embed CSP stays on its own read.
 */
export async function incrementWindow(
  key: string,
  windowSec: number,
  command?: (parts: string[]) => Promise<unknown>,
): Promise<{ count: number; ttl: number } | null> {
  if (!/^cu:rate:(?:signup|demo):[a-f0-9]{24}$/.test(key)) return null;
  if (!Number.isInteger(windowSec) || windowSec < 1 || windowSec > 86_400) return null;
  const run = command ?? (restConfig() ? restCommand : null);
  if (!run) return null;
  try {
    const count = Number(await run(['INCR', key]));
    if (!Number.isFinite(count) || count < 1) return null;
    let ttl = Number(await run(['TTL', key]));
    if (count === 1 || !Number.isFinite(ttl) || ttl < 1) {
      await run(['EXPIRE', key, String(windowSec)]);
      ttl = windowSec;
    }
    return { count, ttl };
  } catch {
    return null;
  }
}
