import { type BrandTokens, contrastRatio, deriveBrand, parseRgbChannels } from './contrast';
import { withUtm } from './utm';

/** Closed set of demo credit unions. The URL slug is the tenant. There is no cookie override. */
export type CuTenantId = 'harborlight-cu' | 'summit-ridge-fcu' | 'larkspur-cu';

export interface CuTenant {
  id: CuTenantId;
  name: string;
  legalName: string;
  tagline: string;
  logo: 'harborlight' | 'summit' | 'larkspur';
  /** Space-separated RGB channels, for example "11 58 91". */
  colors: { primary: string; primaryFg: string; accent: string };
  brand: BrandTokens;
  supportUrl: string;
  privacyUrl: string;
  preApprovalUrl: string;
  ratesUrl: string;
  preApprovalLabel: string;
  ratesLabel: string;
}

/**
 * Fictional pilots. Pre-approval and rate targets use the reserved .example TLD.
 */
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
    supportUrl: 'https://www.harborlightcu.example/help',
    privacyUrl: 'https://www.harborlightcu.example/privacy',
    preApprovalUrl: 'https://www.harborlightcu.example/borrow/auto/preapproval',
    ratesUrl: 'https://www.harborlightcu.example/rates/auto',
    preApprovalLabel: 'Get pre-approved at Harborlight',
    ratesLabel: 'See Harborlight auto rates',
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
    supportUrl: 'https://www.summitridgefcu.example/support',
    privacyUrl: 'https://www.summitridgefcu.example/privacy',
    preApprovalUrl: 'https://www.summitridgefcu.example/loans/preapproval',
    ratesUrl: 'https://www.summitridgefcu.example/loans/auto-rates',
    preApprovalLabel: 'Get pre-approved at Summit Ridge',
    ratesLabel: 'See Summit Ridge auto rates',
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
    supportUrl: 'https://www.larkspurcu.example/help',
    privacyUrl: 'https://www.larkspurcu.example/privacy',
    preApprovalUrl: 'https://www.larkspurcu.example/auto/preapproval',
    ratesUrl: 'https://www.larkspurcu.example/rates/auto',
    preApprovalLabel: 'Get pre-approved at Larkspur',
    ratesLabel: 'See Larkspur auto rates',
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
