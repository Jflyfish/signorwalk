import { deriveBrand, safeLogo, type DerivedBrand } from './contrast';
import { getBranding, type StoredBranding } from './cu-store';
import type { CuTenant } from './tenants';

function merge(base: CuTenant, stored: StoredBranding | null): CuTenant['brand'] {
  if (!stored) return base.brand;
  const shortName = stored.shortName?.trim();
  return {
    ...base.brand,
    shortName: shortName && [...shortName].length <= 24 ? shortName : base.brand.shortName,
    primary: stored.primary || base.brand.primary,
    secondary: stored.secondary || base.brand.secondary,
    logoLight: safeLogo(stored.logoLight) || base.brand.logoLight,
    logoDark: safeLogo(stored.logoDark) || base.brand.logoDark,
    logoAspect: stored.logoAspect || base.brand.logoAspect,
    font: 'inter',
  };
}

export async function resolveBrand(tenant: CuTenant): Promise<DerivedBrand> {
  try {
    const stored = await getBranding(tenant.id);
    return deriveBrand(tenant.id, merge(tenant, stored));
  } catch {
    return deriveBrand(tenant.id, tenant.brand);
  }
}

export type { DerivedBrand };
