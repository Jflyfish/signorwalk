import { contrastRatio, parseRgbChannels } from './contrast';
import { withUtm } from './utm';

/** Closed set of demo credit unions. The URL slug is the tenant. There is no cookie override. */
export type CuTenantId = 'harborlight-cu' | 'summit-ridge-fcu';

export interface CuTenant {
  id: CuTenantId;
  name: string;
  legalName: string;
  tagline: string;
  logo: 'harborlight' | 'summit';
  /** Space-separated RGB channels, for example "11 58 91". */
  colors: { primary: string; primaryFg: string; accent: string };
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
    supportUrl: 'https://www.summitridgefcu.example/support',
    privacyUrl: 'https://www.summitridgefcu.example/privacy',
    preApprovalUrl: 'https://www.summitridgefcu.example/loans/preapproval',
    ratesUrl: 'https://www.summitridgefcu.example/loans/auto-rates',
    preApprovalLabel: 'Get pre-approved at Summit Ridge',
    ratesLabel: 'See Summit Ridge auto rates',
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
    const primary = parseRgbChannels(tenant.colors.primary);
    const fg = parseRgbChannels(tenant.colors.primaryFg);
    const accent = parseRgbChannels(tenant.colors.accent);
    if (contrastRatio(primary, fg) < 4.5) throw new Error(`${tenant.id} primary contrast`);
    if (contrastRatio(accent, white) < 4.5) throw new Error(`${tenant.id} accent contrast`);
  }
}

assertCuContrast();
