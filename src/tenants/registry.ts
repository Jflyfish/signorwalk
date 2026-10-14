import type { Tenant, TenantFeatures } from './types';

const CU_FEATURES: TenantFeatures = {
  aiReport: false,
  emailCapture: false,
  negotiationSupport: false,
  askAPro: false,
  blog: false,
  glossary: false,
  documentUpload: false,
  sowMarketing: false,
  persistDeal: false,
  freeText: false,
};

const SOW_FEATURES: TenantFeatures = {
  aiReport: true,
  emailCapture: true,
  negotiationSupport: true,
  askAPro: true,
  blog: true,
  glossary: true,
  documentUpload: true,
  sowMarketing: true,
  persistDeal: true,
  freeText: true,
};

export const SOW_TENANT: Tenant = {
  id: 'sow',
  hosts: ['signorwalk.com', 'www.signorwalk.com'],
  brand: {
    name: 'Sign or Walk',
    legalName: 'Sign or Walk',
    tagline: 'Know before you sign.',
    logo: 'sow',
    colors: { primary: '59 130 246', primaryFg: '255 255 255', accent: '37 99 235' },
    supportUrl: 'https://signorwalk.com/contact',
    privacyUrl: 'https://signorwalk.com',
  },
  features: SOW_FEATURES,
  cta: null,
  disclosures: { footerId: 'sow-default', templatePackVersion: 'tp-1.0.0' },
  analytics: { enabled: true },
  indexable: true,
};

/**
 * Fictional pilot tenants. Hosts are the production subdomain names.
 * On a Vercel preview, open them with `?tenant=` (disabled when VERCEL_ENV=production).
 * CTA targets use the reserved .example TLD so they never point at a real credit union.
 */
export const TENANTS: Tenant[] = [
  SOW_TENANT,
  {
    id: 'harborlight-cu',
    hosts: ['harborlight.signorwalk.app'],
    brand: {
      name: 'Harborlight Credit Union',
      legalName: 'Harborlight Credit Union',
      tagline: 'Check a vehicle offer',
      logo: 'harborlight',
      colors: { primary: '11 58 91', primaryFg: '255 255 255', accent: '7 89 133' },
      supportUrl: 'https://www.harborlightcu.example/help',
      privacyUrl: 'https://www.harborlightcu.example/privacy',
    },
    features: CU_FEATURES,
    cta: {
      loanRateUrl: 'https://www.harborlightcu.example/rates/auto',
      preApprovalUrl: 'https://www.harborlightcu.example/borrow/auto/preapproval',
      preApprovalLabel: 'Get pre-approved at Harborlight',
      ratesLabel: 'See Harborlight auto rates',
    },
    disclosures: { footerId: 'cu-v1', templatePackVersion: 'tp-1.0.0' },
    analytics: { enabled: true },
    indexable: false,
  },
  {
    id: 'summit-ridge-fcu',
    hosts: ['summitridge.signorwalk.app'],
    brand: {
      name: 'Summit Ridge Federal Credit Union',
      legalName: 'Summit Ridge Federal Credit Union',
      tagline: 'Check a vehicle offer',
      logo: 'summit',
      colors: { primary: '20 83 45', primaryFg: '255 255 255', accent: '22 101 52' },
      supportUrl: 'https://www.summitridgefcu.example/support',
      privacyUrl: 'https://www.summitridgefcu.example/privacy',
    },
    features: CU_FEATURES,
    cta: {
      loanRateUrl: 'https://www.summitridgefcu.example/loans/auto-rates',
      preApprovalUrl: 'https://www.summitridgefcu.example/loans/preapproval',
      preApprovalLabel: 'Get pre-approved at Summit Ridge',
      ratesLabel: 'See Summit Ridge auto rates',
    },
    disclosures: { footerId: 'cu-v1', templatePackVersion: 'tp-1.0.0' },
    analytics: { enabled: true },
    indexable: false,
  },
];

const BY_ID = new Map(TENANTS.map(t => [t.id, t]));

export function getTenantById(id: string | null | undefined): Tenant | undefined {
  if (!id) return undefined;
  return BY_ID.get(id as Tenant['id']);
}
