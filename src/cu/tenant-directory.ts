import { deriveBrand, parseHex } from './contrast';
import {
  deleteTenantData,
  getBranding,
  readStoreJson,
  saveBranding,
  storeKey,
  writeStoreJson,
  type StoredBranding,
} from './cu-store';
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
}

export interface ResolvedTenant extends CuTenant {
  status: 'active' | 'paused';
}

export const TENANT_UNAVAILABLE = 'This check is unavailable.';
export const STATUS_PAUSED = 'Paused. Members see an unavailable page.';
export const STATUS_ACTIVE = 'Active. Members can use the check.';

const INDEX_KEY = 'cu:directory:index';
const SEEDED_KEY = 'cu:directory:seeded';
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
}): StoredTenantProfile | null {
  const id = input.id.trim().toLowerCase();
  if (!SLUG.test(id) || id.length > 48 || RESERVED.has(id)) return null;
  const name = clip(input.name, 80);
  if ([...name].length < 2) return null;
  const legalName = clip(input.legalName || name, 120);
  const tagline = clip(input.tagline || 'Check a vehicle offer', 80);
  const preApprovalUrl = input.preApprovalUrl.trim();
  const ratesUrl = input.ratesUrl.trim();
  if (!httpsUrl(preApprovalUrl) || !httpsUrl(ratesUrl)) return null;
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
  };
}

function fromSeed(seed: CuTenant): StoredTenantProfile {
  return {
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

export async function ensureTenantDirectory(): Promise<void> {
  if (await readStoreJson(SEEDED_KEY)) return;
  const index = await readIndex();
  if (!index || index.length === 0) {
    for (const seed of CU_TENANTS) {
      await writeStoreJson(storeKey(seed.id, 'profile'), fromSeed(seed));
    }
    await writeIndex(CU_TENANTS.map(seed => seed.id));
  }
  await writeStoreJson(SEEDED_KEY, { seeded: true });
}

function channels(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return '17 17 17';
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
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
    supportUrl: profile.supportUrl,
    privacyUrl: profile.privacyUrl,
    preApprovalUrl: profile.preApprovalUrl,
    ratesUrl: profile.ratesUrl,
    preApprovalLabel: profile.preApprovalLabel,
    ratesLabel: profile.ratesLabel,
    embedOrigins: profile.embedOrigins,
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
  if (branding) {
    const current = await getBranding(profile.id);
    await saveBranding(profile.id, {
      ...current,
      shortName: branding.shortName.trim().replace(/\s+/g, ' '),
      primary: branding.primary,
      font: 'inter',
    });
  }
}

export async function setTenantStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  const profile = await getTenantProfile(id);
  if (!profile) throw new Error('missing');
  profile.status = status;
  await writeStoreJson(storeKey(id, 'profile'), profile);
}

export async function replaceEmbedOrigins(id: string, origins: string[]): Promise<void> {
  const profile = await getTenantProfile(id);
  if (!profile) throw new Error('missing');
  profile.embedOrigins = origins;
  await writeStoreJson(storeKey(id, 'profile'), profile);
}

export async function removeTenant(id: string): Promise<void> {
  await ensureTenantDirectory();
  const index = (await readIndex()) ?? [];
  await writeIndex(index.filter(item => item !== id));
  await deleteTenantData(id);
}
