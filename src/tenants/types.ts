/** Tenant ids are a closed set. Add a credit-union pilot by editing the registry in a PR. */
export type TenantId = 'sow' | 'harborlight-cu' | 'summit-ridge-fcu';

export type LogoId = 'sow' | 'harborlight' | 'summit';

export interface TenantBrand {
  name: string;
  legalName: string;
  tagline: string;
  logo: LogoId;
  /** Space-separated RGB channels, e.g. "11 58 91", for CSS variables. */
  colors: {
    primary: string;
    primaryFg: string;
    accent: string;
  };
  supportUrl: string;
  privacyUrl: string;
}

export interface TenantCta {
  loanRateUrl: string;
  preApprovalUrl: string;
  preApprovalLabel: string;
  ratesLabel: string;
}

export interface TenantFeatures {
  /** Consumer AI report. Credit-union tenants are rules-only. */
  aiReport: boolean;
  emailCapture: boolean;
  negotiationSupport: boolean;
  askAPro: boolean;
  blog: boolean;
  glossary: boolean;
  documentUpload: boolean;
  /** About, contact, and other Sign or Walk marketing pages. */
  sowMarketing: boolean;
  /** localStorage / sessionStorage of deal data. */
  persistDeal: boolean;
  /** notes, knownIssues, otherLabel, and other free-text fields. */
  freeText: boolean;
}

export interface Tenant {
  id: TenantId;
  hosts: string[];
  brand: TenantBrand;
  features: TenantFeatures;
  cta: TenantCta | null;
  disclosures: {
    footerId: 'sow-default' | 'cu-v1';
    templatePackVersion: 'tp-1.0.0';
  };
  analytics: { enabled: boolean };
  /** Credit-union hosts are noindex so they do not compete with signorwalk.com. */
  indexable: boolean;
}

/** Serializable subset passed to client components. URLs already include UTM parameters. */
export interface PublicTenant {
  id: Exclude<TenantId, 'sow'>;
  brand: {
    name: string;
    legalName: string;
    tagline: string;
    logo: Exclude<LogoId, 'sow'>;
    supportUrl: string;
    privacyUrl: string;
  };
  cta: {
    preApprovalUrl: string;
    ratesUrl: string;
    preApprovalLabel: string;
    ratesLabel: string;
  };
  templatePackVersion: 'tp-1.0.0';
}
