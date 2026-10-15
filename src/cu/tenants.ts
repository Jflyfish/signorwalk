import { type BrandTokens, contrastRatio, deriveBrand, parseRgbChannels } from './contrast';
import { withUtm } from './utm';

/** Closed set of demo credit unions. The URL slug is the tenant. There is no cookie override. */
export type CuTenantId = 'harborlight-cu' | 'summit-ridge-fcu' | 'larkspur-cu';

export interface CuTenant {
  id: string;
  name: string;
  legalName: string;
  tagline: string;
  logo?: 'harborlight' | 'summit' | 'larkspur';
  /** Active when omitted. The store is the runtime source for pause. */
  status?: 'active' | 'paused';
  /** Space-separated RGB channels, for example "11 58 91". */
  colors: { primary: string; primaryFg: string; accent: string };
  brand: BrandTokens;
  supportUrl: string;
  privacyUrl: string;
  preApprovalUrl: string;
  ratesUrl: string;
  preApprovalLabel: string;
  ratesLabel: string;
  /** HTTPS origins allowed to frame /cu/{id}/embed. Never '*'. */
  embedOrigins: readonly string[];
}

/**
 * Fictional pilots. Loan, help, and privacy links are paths on this host.
 * Embed origins stay on the reserved .example TLD. Do not store a production origin here.
 */
const DEMO_PREAPPROVAL = '/credit-unions/demo/preapproval';
const DEMO_RATES = '/credit-unions/demo/rates';
const DEMO_HELP = '/credit-unions/demo/help';
const DEMO_PRIVACY = '/credit-unions/demo/privacy';
export const CU_TENANTS: readonly CuTenant[] = [
  {
    id: 'harborlight-cu',
    name: 'Harborlight Credit Union',
    legalName: 'Harborlight Credit Union',
    tagline: 'Check a vehicle offer',
    logo: 'harborlight',
    colors: { primary: '11 58 91', primaryFg: '255 255 255', accent: '7 89 133' },
    brand: {
      name: 'Harborlight Credit Union',
      shortName: 'Harborlight CU',
      primary: '#075985',
      logoLight: '/cu-brand/harborlight.svg',
      logoAspect: 1,
    },
    supportUrl: DEMO_HELP,
    privacyUrl: DEMO_PRIVACY,
    preApprovalUrl: DEMO_PREAPPROVAL,
    ratesUrl: DEMO_RATES,
    preApprovalLabel: 'Demo only: pre-approval',
    ratesLabel: 'Demo only: auto rates',
    embedOrigins: ['https://www.harborlightcu.example'],
  },
  {
    id: 'summit-ridge-fcu',
    name: 'Summit Ridge Federal Credit Union',
    legalName: 'Summit Ridge Federal Credit Union',
    tagline: 'Check a vehicle offer',
    logo: 'summit',
    colors: { primary: '20 83 45', primaryFg: '255 255 255', accent: '22 101 52' },
    brand: {
      name: 'Summit Ridge Federal Credit Union',
      shortName: 'Summit Ridge FCU',
      primary: '#166534',
      logoLight: '/cu-brand/summit.svg',
      logoAspect: 1,
    },
    supportUrl: DEMO_HELP,
    privacyUrl: DEMO_PRIVACY,
    preApprovalUrl: DEMO_PREAPPROVAL,
    ratesUrl: DEMO_RATES,
    preApprovalLabel: 'Demo only: pre-approval',
    ratesLabel: 'Demo only: auto rates',
    embedOrigins: ['https://www.summitridgefcu.example'],
  },
  {
    id: 'larkspur-cu',
    name: 'Larkspur Credit Union',
    legalName: 'Larkspur Credit Union',
    tagline: 'Check a vehicle offer',
    logo: 'larkspur',
    colors: { primary: '253 230 138', primaryFg: '17 17 17', accent: '138 116 3' },
    brand: {
      name: 'Larkspur Credit Union',
      shortName: 'Larkspur CU',
      primary: '#FDE68A',
      logoLight: '/cu-brand/larkspur.svg',
      logoAspect: 1,
    },
    supportUrl: DEMO_HELP,
    privacyUrl: DEMO_PRIVACY,
    preApprovalUrl: DEMO_PREAPPROVAL,
    ratesUrl: DEMO_RATES,
    preApprovalLabel: 'Demo only: pre-approval',
    ratesLabel: 'Demo only: auto rates',
    embedOrigins: ['https://www.larkspurcu.example'],
  },
];

const BY_ID = new Map(CU_TENANTS.map(tenant => [tenant.id, tenant]));

export function getCuTenant(slug: string | null | undefined): CuTenant | undefined {
  if (!slug) return undefined;
  return BY_ID.get(slug.trim().toLowerCase() as CuTenantId);
}

export interface CuPublic extends CuTenant {
  preApprovalUrl: string;
  ratesUrl: string;
}

/** URLs already include aggregate UTM parameters. */
export function toCuPublic(tenant: CuTenant): CuPublic {
  return {
    ...tenant,
    preApprovalUrl: withUtm(tenant.preApprovalUrl, tenant.id, 'preapproval'),
    ratesUrl: withUtm(tenant.ratesUrl, tenant.id, 'rates'),
  };
}

export function assertCuContrast(): void {
  const white: [number, number, number] = [255, 255, 255];
  for (const tenant of CU_TENANTS) {
    if ([...tenant.brand.shortName].length > 24) throw new Error(`${tenant.id} shortName`);
    const primary = parseRgbChannels(tenant.colors.primary);
    const fg = parseRgbChannels(tenant.colors.primaryFg);
    const accent = parseRgbChannels(tenant.colors.accent);
    if (contrastRatio(primary, fg) < 4.5) throw new Error(`${tenant.id} primary contrast`);
    if (contrastRatio(accent, white) < 4.5) throw new Error(`${tenant.id} accent contrast`);
    const brand = deriveBrand(tenant.id, tenant.brand, () => undefined);
    if (brand.fallback) throw new Error(`${tenant.id} brand fallback`);
    if (contrastRatio(parseHexRequired(brand.brandText), white) < 4.5) throw new Error(`${tenant.id} brandText`);
    if (contrastRatio(white, parseHexRequired(brand.brandFill)) < 4.5) throw new Error(`${tenant.id} brandFill`);
  }
}

function parseHexRequired(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/.exec(hex);
  if (!match) throw new Error(`Invalid derived hex: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

assertCuContrast();
