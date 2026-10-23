import { deriveBrand, parseHex } from './contrast';
import {
  clearFrameAncestorCache,
  deleteTenantData,
  getBranding,
  readStoreJson,
  saveBranding,
  storeKey,
  writeStoreJson,
  type StoredBranding,
} from './cu-store';
import { deleteStaffLogin } from './staff-login';
import { isEmbedOrigin } from './embed';
import { CU_TENANTS, getCuTenant, type CuTenant } from './tenants';

/** Runtime credit-union profile. Demo records are copied from config seeds once per empty store. */
export interface StoredTenantProfile {
  id: string;
  name: string;
  legalName: string;
  tagline: string;
  supportUrl: string;
  privacyUrl: string;
  preApprovalUrl: string;
  ratesUrl: string;
  preApprovalLabel: string;
  ratesLabel: string;
  embedOrigins: string[];
  status: 'active' | 'paused';
  contactName?: string;
  trialEndsAt?: string;
  /** False until the trial confirmation step. Missing means a seeded or owner-created credit union. */
  verified?: boolean;
  confirmHash?: string;
  /** Plan chosen at signup. Absent for a seed or an owner-created credit union. */
  tier?: 'starter' | 'growth' | 'pro';
  /** False until staff save their own pre-approval URL. Absent means the stored URL is real. */
  loanLinksSet?: boolean;
  /** False until staff save a rates URL. Absent on a seed that ships a demo rates path. */
  ratesLinkSet?: boolean;
  /** 1, 2, or 3. Absent on a seeded credit union. */
  onboardingStep?: 1 | 2 | 3;
  /** False until the three setup steps are done. Absent on a seeded credit union. */
  onboardingComplete?: boolean;
  /** Optional line the credit union wrote. Not a member record. */
  disclosure?: string;
}

export interface ResolvedTenant extends CuTenant {
  status: 'active' | 'paused';
  contactName?: string;
  trialEndsAt?: string;
  verified: boolean;
  tier?: 'starter' | 'growth' | 'pro';
  loanLinksSet?: boolean;
  ratesLinkSet?: boolean;
  onboardingStep?: 1 | 2 | 3;
  onboardingComplete?: boolean;
  disclosure?: string;
}

export const TENANT_UNAVAILABLE = 'This check is unavailable.';

export function tenantUnavailable(tenant: { status: 'active' | 'paused'; trialEndsAt?: string; verified?: boolean }, now = Date.now()): boolean {
  if (tenant.status === 'paused' || tenant.verified === false) return true;
  if (!tenant.trialEndsAt) return false;
  const ends = Date.parse(tenant.trialEndsAt);
  return Number.isFinite(ends) && ends <= now;
}

export function slugFromName(name: string): string | null {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  if (!slug || !SLUG.test(slug) || RESERVED.has(slug)) return null;
  return slug;
}

export async function uniqueSlug(base: string): Promise<string | null> {
  await ensureTenantDirectory();
  const index = (await readIndex()) ?? [];
  if (!index.includes(base)) return base;
  for (let n = 2; n <= 20; n += 1) {
    const next = `${base.slice(0, 44).replace(/-+$/g, '')}-${n}`;
    if (SLUG.test(next) && !RESERVED.has(next) && !index.includes(next)) return next;
  }
  return null;
}
export const STATUS_PAUSED = 'Paused. Members see an unavailable page.';
export const STATUS_ACTIVE = 'Active. Members can use the check.';

const INDEX_KEY = 'cu:directory:index';
const SEEDED_KEY = 'cu:directory:seeded';
/** Ids removed on purpose. A later seed backfill must not put them back. */
const REMOVED_KEY = 'cu:directory:removed';
const RESERVED = new Set(['new', 'admin', 'api', 'embed', 'dashboard', 'sign-in']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function tenantBrandOk(id: string, shortName: string, primary: string): boolean {
  const name = shortName.trim().replace(/\s+/g, ' ');
  if ([...name].length < 1 || [...name].length > 24) return false;
  if (!/^#[0-9a-fA-F]{6}$/.test(primary)) return false;
  const brand = deriveBrand(id, { name, shortName: name, primary, logoAspect: 1 }, () => undefined);
  return !brand.fallback;
}

export function parseEmbedOrigins(text: string): string[] | null {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length > 8) return null;
  const origins: string[] = [];
  for (const line of lines) {
    if (!isEmbedOrigin(line) || origins.includes(line.toLowerCase())) return null;
    origins.push(line.toLowerCase());
  }
  return origins;
}

export function removalConfirmed(value: string): boolean {
  return value === 'remove';
}

export function removalIdMatches(typed: string, id: string): boolean {
  return typed.trim() === id;
}

function httpsUrl(value: string): boolean {
  if (value.length > 300) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function clip(value: string, max: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

export function normalizeProfile(input: {
  id: string;
  name: string;
  legalName?: string;
  tagline?: string;
  supportUrl?: string;
  privacyUrl?: string;
  preApprovalUrl: string;
  ratesUrl: string;
  preApprovalLabel?: string;
  ratesLabel?: string;
  embedOrigins: string[];
  status: 'active' | 'paused';
  shortName?: string;
  contactName?: string;
  trialEndsAt?: string;
  verified?: boolean;
  confirmHash?: string;
  tier?: 'starter' | 'growth' | 'pro';
  loanLinksSet?: boolean;
  ratesLinkSet?: boolean;
  onboardingStep?: 1 | 2 | 3;
  onboardingComplete?: boolean;
  disclosure?: string;
}): StoredTenantProfile | null {
  const id = input.id.trim().toLowerCase();
  if (!SLUG.test(id) || id.length > 48 || RESERVED.has(id)) return null;
  const name = clip(input.name, 80);
  if ([...name].length < 2) return null;
  const legalName = clip(input.legalName || name, 120);
  const tagline = clip(input.tagline || 'Check a vehicle offer', 80);
  const preApprovalUrl = input.preApprovalUrl.trim();
  const ratesUrl = input.ratesUrl.trim();
  if (!httpsUrl(preApprovalUrl)) return null;
  if (ratesUrl && !httpsUrl(ratesUrl)) return null;
  const supportUrl = (input.supportUrl || preApprovalUrl).trim();
  const privacyUrl = (input.privacyUrl || preApprovalUrl).trim();
  if (!httpsUrl(supportUrl) || !httpsUrl(privacyUrl)) return null;
  const short = clip(input.shortName || name, 24);
  const preApprovalLabel = clip(input.preApprovalLabel || `Get pre-approved at ${short}`, 80);
  const ratesLabel = clip(input.ratesLabel || `See ${short} auto rates`, 80);
  if (!preApprovalLabel || !ratesLabel || !tagline || !legalName) return null;
  if (input.status !== 'active' && input.status !== 'paused') return null;
  return {
    id,
    name,
    legalName,
    tagline,
    supportUrl,
    privacyUrl,
    preApprovalUrl,
    ratesUrl,
    preApprovalLabel,
    ratesLabel,
    embedOrigins: input.embedOrigins,
    status: input.status,
    contactName: input.contactName?.trim() ? clip(input.contactName, 80) : undefined,
    trialEndsAt: input.trialEndsAt && Number.isFinite(Date.parse(input.trialEndsAt)) ? input.trialEndsAt : undefined,
    verified: input.verified,
    confirmHash: input.confirmHash,
    tier: input.tier === 'starter' || input.tier === 'growth' || input.tier === 'pro' ? input.tier : undefined,
    loanLinksSet: input.loanLinksSet === true ? true : input.loanLinksSet === false ? false : undefined,
    ratesLinkSet: input.ratesLinkSet === true ? true : input.ratesLinkSet === false ? false : undefined,
    onboardingStep: input.onboardingStep === 1 || input.onboardingStep === 2 || input.onboardingStep === 3 ? input.onboardingStep : undefined,
    onboardingComplete: input.onboardingComplete === true ? true : input.onboardingComplete === false ? false : undefined,
    disclosure: input.disclosure?.trim() ? clip(input.disclosure, 180) : undefined,
  };
}

function fromSeed(seed: CuTenant): StoredTenantProfile {
  const profile: StoredTenantProfile = {
    id: seed.id,
    name: seed.name,
    legalName: seed.legalName,
    tagline: seed.tagline,
    supportUrl: seed.supportUrl,
    privacyUrl: seed.privacyUrl,
    preApprovalUrl: seed.preApprovalUrl,
    ratesUrl: seed.ratesUrl,
    preApprovalLabel: seed.preApprovalLabel,
    ratesLabel: seed.ratesLabel,
    embedOrigins: [...seed.embedOrigins],
    status: 'active',
  };
  if (seed.id === 'preview-sample-cu') {
    profile.trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    profile.disclosure = 'Fictional preview. Not a real credit union.';
    profile.verified = true;
  }
  return profile;
}

/** Hide a rates link the credit union did not enter. Demo paths on the seeds stay. */
export function memberRatesUrl(tenant: {
  ratesUrl: string;
  ratesLinkSet?: boolean;
  embedOrigins?: readonly string[];
}): string {
  const url = tenant.ratesUrl.trim();
  if (!url || tenant.ratesLinkSet === false) return '';
  if (tenant.ratesLinkSet === true) return url;
  return ratesFallback(url, tenant.embedOrigins ?? []) ? '' : url;
}

function ratesFallback(url: string, origins: readonly string[]): boolean {
  try {
    const parsed = new URL(url, 'https://signorwalk.com');
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    if (path === '/credit-unions/demo/rates') return false;
    const origin = parsed.origin.toLowerCase();
    if (path !== '/') return false;
    if (origin === 'https://signorwalk.com') return true;
    return origins.some(item => item.toLowerCase() === origin);
  } catch {
    return true;
  }
}

async function readIndex(): Promise<string[] | null> {
  const parsed = await readStoreJson<unknown>(INDEX_KEY);
  if (!parsed) return null;
  if (!Array.isArray(parsed) || parsed.some(id => typeof id !== 'string')) return [];
  return parsed as string[];
}

async function writeIndex(ids: string[]): Promise<void> {
  await writeStoreJson(INDEX_KEY, ids);
}

async function readRemoved(): Promise<string[]> {
  const parsed = await readStoreJson<unknown>(REMOVED_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === 'string');
}

async function insertMissingSeeds(): Promise<void> {
  const index = (await readIndex()) ?? [];
  const removed = new Set(await readRemoved());
  let changed = false;
  for (const seed of CU_TENANTS) {
    if (index.includes(seed.id) || removed.has(seed.id)) continue;
    const existing = await readStoreJson(storeKey(seed.id, 'profile'));
    if (!existing) await writeStoreJson(storeKey(seed.id, 'profile'), fromSeed(seed));
    index.push(seed.id);
    changed = true;
  }
  if (changed) await writeIndex(index);
}

export async function ensureTenantDirectory(): Promise<void> {
  if (!(await readStoreJson(SEEDED_KEY))) {
    const index = await readIndex();
    if (!index || index.length === 0) {
      for (const seed of CU_TENANTS) {
        await writeStoreJson(storeKey(seed.id, 'profile'), fromSeed(seed));
      }
      await writeIndex(CU_TENANTS.map(seed => seed.id));
    }
    await writeStoreJson(SEEDED_KEY, { seeded: true });
  }
  await insertMissingSeeds();
}

function channels(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return '17 17 17';
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

/** A store seeded earlier may still hold .example or an absolute production demo URL. */
function placeholderHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'signorwalk.com' || host.endsWith('.signorwalk.com') || host === 'example' || host.endsWith('.example');
  } catch {
    return false;
  }
}

function sandboxLink(profileUrl: string, seedUrl: string | undefined): string {
  if (!seedUrl || !placeholderHost(profileUrl)) return profileUrl;
  return seedUrl;
}

function materialize(profile: StoredTenantProfile, branding: StoredBranding | null, seed?: CuTenant): ResolvedTenant {
  const base = seed?.brand ?? {
    name: profile.name,
    shortName: profile.name,
    primary: '#111111',
    logoAspect: 1,
    font: 'inter' as const,
  };
  const shortName = branding?.shortName?.trim();
  const brand = {
    ...base,
    name: profile.name,
    shortName: shortName && [...shortName].length <= 24 ? shortName : base.shortName,
    primary: branding?.primary || base.primary,
    secondary: branding?.secondary || base.secondary,
    logoLight: branding?.logoLight || base.logoLight,
    logoDark: branding?.logoDark || base.logoDark,
    logoAspect: branding?.logoAspect || base.logoAspect,
    font: 'inter' as const,
  };
  const derived = deriveBrand(profile.id, brand, () => undefined);
  return {
    id: profile.id,
    name: profile.name,
    legalName: profile.legalName,
    tagline: profile.tagline,
    logo: seed?.logo,
    status: profile.status,
    colors: {
      primary: channels(derived.brandFill),
      primaryFg: derived.onBrand === '#111111' ? '17 17 17' : '255 255 255',
      accent: channels(derived.brandText),
    },
    brand,
    supportUrl: seed ? sandboxLink(profile.supportUrl, seed.supportUrl) : profile.supportUrl,
    privacyUrl: seed ? sandboxLink(profile.privacyUrl, seed.privacyUrl) : profile.privacyUrl,
    preApprovalUrl: seed ? sandboxLink(profile.preApprovalUrl, seed.preApprovalUrl) : profile.preApprovalUrl,
    ratesUrl: seed ? sandboxLink(profile.ratesUrl, seed.ratesUrl) : profile.ratesUrl,
    preApprovalLabel: profile.preApprovalLabel,
    ratesLabel: profile.ratesLabel,
    embedOrigins: profile.embedOrigins,
    contactName: profile.contactName,
    trialEndsAt: profile.trialEndsAt,
    verified: profile.verified !== false,
    tier: profile.tier,
    loanLinksSet: profile.loanLinksSet,
    ratesLinkSet: profile.ratesLinkSet,
    onboardingStep: profile.onboardingStep,
    onboardingComplete: profile.onboardingComplete,
    disclosure: profile.disclosure,
  };
}

export async function loadCuTenant(slug: string | null | undefined): Promise<ResolvedTenant | undefined> {
  if (!slug) return undefined;
  const id = slug.trim().toLowerCase();
  if (!SLUG.test(id)) return undefined;
  await ensureTenantDirectory();
  const index = await readIndex();
  if (!index?.includes(id)) return undefined;
  const profile = await readStoreJson<StoredTenantProfile>(storeKey(id, 'profile'));
  if (!profile || profile.id !== id) return undefined;
  const branding = await getBranding(id);
  return materialize(profile, branding, getCuTenant(id));
}

export async function listCuTenants(): Promise<ResolvedTenant[]> {
  await ensureTenantDirectory();
  const index = (await readIndex()) ?? [];
  const rows: ResolvedTenant[] = [];
  for (const id of index) {
    const tenant = await loadCuTenant(id);
    if (tenant) rows.push(tenant);
  }
  return rows;
}

export { listCuTenants as listCreditUnions };

export async function getTenantProfile(id: string): Promise<StoredTenantProfile | null> {
  await ensureTenantDirectory();
  return readStoreJson<StoredTenantProfile>(storeKey(id, 'profile'));
}

export async function saveTenantProfile(profile: StoredTenantProfile, branding?: { shortName: string; primary: string }): Promise<void> {
  await ensureTenantDirectory();
  if (branding && !tenantBrandOk(profile.id, branding.shortName, branding.primary)) {
    throw new Error('brand');
  }
  await writeStoreJson(storeKey(profile.id, 'profile'), profile);
  const index = (await readIndex()) ?? [];
  if (!index.includes(profile.id)) await writeIndex([...index, profile.id]);
  const removed = await readRemoved();
  if (removed.includes(profile.id)) {
    await writeStoreJson(REMOVED_KEY, removed.filter(item => item !== profile.id));
  }
  if (branding) {
    const current = await getBranding(profile.id);
    await saveBranding(profile.id, {
      ...current,
      shortName: branding.shortName.trim().replace(/\s+/g, ' '),
      primary: branding.primary,
      font: 'inter',
    });
  }
  clearFrameAncestorCache(profile.id);
}

export async function setTenantStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  const profile = await getTenantProfile(id);
  if (!profile) throw new Error('missing');
  profile.status = status;
  await writeStoreJson(storeKey(id, 'profile'), profile);
  clearFrameAncestorCache(id);
}

export async function replaceEmbedOrigins(id: string, origins: string[]): Promise<void> {
  const profile = await getTenantProfile(id);
  if (!profile) throw new Error('missing');
  profile.embedOrigins = origins;
  await writeStoreJson(storeKey(id, 'profile'), profile);
  clearFrameAncestorCache(id);
}

export async function removeTenant(id: string): Promise<void> {
  await ensureTenantDirectory();
  const index = (await readIndex()) ?? [];
  await writeIndex(index.filter(item => item !== id));
  const removed = await readRemoved();
  if (!removed.includes(id)) await writeStoreJson(REMOVED_KEY, [...removed, id]);
  await deleteTenantData(id);
  await deleteStaffLogin(id);
  clearFrameAncestorCache(id);
}
