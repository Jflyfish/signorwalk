import { withUtm } from './utm';
import type { PublicTenant, Tenant } from './types';

export function toPublicTenant(tenant: Tenant): PublicTenant {
  if (tenant.id === 'sow' || !tenant.cta || tenant.brand.logo === 'sow') {
    throw new Error('Consumer tenant has no credit-union public config');
  }
  return {
    id: tenant.id,
    brand: {
      name: tenant.brand.name,
      legalName: tenant.brand.legalName,
      tagline: tenant.brand.tagline,
      logo: tenant.brand.logo,
      supportUrl: tenant.brand.supportUrl,
      privacyUrl: tenant.brand.privacyUrl,
    },
    cta: {
      preApprovalUrl: withUtm(tenant.cta.preApprovalUrl, tenant.id, 'preapproval'),
      ratesUrl: withUtm(tenant.cta.loanRateUrl, tenant.id, 'rates'),
      preApprovalLabel: tenant.cta.preApprovalLabel,
      ratesLabel: tenant.cta.ratesLabel,
    },
    templatePackVersion: tenant.disclosures.templatePackVersion,
  };
}
