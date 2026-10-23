'use server';

import { cookies } from 'next/headers';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { deriveBrand, parseHex, safeLogo } from '@/cu/contrast';
import { getBranding, saveBranding, type StoredBranding } from '@/cu/cu-store';
import { getTenantProfile, saveTenantProfile } from '@/cu/tenant-directory';

async function staffCanEdit(tenant: string): Promise<boolean> {
  const jar = await cookies();
  const session = verifySession(jar.get(CU_SESSION_COOKIE)?.value);
  if (!canOpenTenant(session, tenant)) return false;
  const profile = await getTenantProfile(tenant);
  if (!profile) return false;
  if (session?.role !== 'admin' && profile.verified === false) return false;
  return true;
}

function httpsUrl(value: string): boolean {
  if (value.length === 0 || value.length > 300) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function saveOnboardingBrand(
  tenant: string,
  logoUrl: string,
  color: string,
): Promise<{ ok: true; primary: string } | { ok: false; error: string }> {
  if (!(await staffCanEdit(tenant))) return { ok: false, error: 'Sign in to continue.' };
  const logo = safeLogo(logoUrl.trim());
  if (!logo || !logo.startsWith('https:')) return { ok: false, error: 'Enter an https logo URL.' };
  if (!parseHex(color)) return { ok: false, error: 'Enter a color like #075985.' };
  const profile = await getTenantProfile(tenant);
  if (!profile) return { ok: false, error: 'This credit union was not found.' };
  const current = await getBranding(tenant);
  const shortName = (current?.shortName || profile.name).trim().slice(0, 24);
  const derived = deriveBrand(tenant, {
    name: profile.name,
    shortName,
    primary: color.trim(),
    logoLight: logo,
    logoAspect: current?.logoAspect || 1,
    font: 'inter',
  }, () => undefined);
  const branding: StoredBranding = {
    ...current,
    shortName,
    primary: derived.brandFill,
    logoLight: logo,
    font: 'inter',
  };
  try {
    await saveBranding(tenant, branding);
    if (!profile.onboardingStep) profile.onboardingStep = 1;
    await saveTenantProfile(profile);
  } catch {
    return { ok: false, error: 'That logo or color could not be saved.' };
  }
  return { ok: true, primary: derived.brandFill };
}

export async function saveOnboardingLoan(
  tenant: string,
  loanUrl: string,
  disclosure: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await staffCanEdit(tenant))) return { ok: false, error: 'Sign in to continue.' };
  const loan = loanUrl.trim();
  if (!httpsUrl(loan)) return { ok: false, error: 'Enter an https loan application URL.' };
  const line = disclosure.trim().replace(/\s+/g, ' ').slice(0, 180);
  const profile = await getTenantProfile(tenant);
  if (!profile) return { ok: false, error: 'This credit union was not found.' };
  profile.preApprovalUrl = loan;
  profile.loanLinksSet = true;
  profile.disclosure = line || undefined;
  if (!profile.onboardingStep || profile.onboardingStep < 2) profile.onboardingStep = 2;
  try {
    await saveTenantProfile(profile);
  } catch {
    return { ok: false, error: 'That line could not be saved.' };
  }
  return { ok: true };
}

export async function saveOnboardingStep(tenant: string, step: 1 | 2 | 3, complete = false): Promise<boolean> {
  if (!(await staffCanEdit(tenant))) return false;
  const profile = await getTenantProfile(tenant);
  if (!profile) return false;
  profile.onboardingStep = step;
  if (complete) profile.onboardingComplete = true;
  try {
    await saveTenantProfile(profile);
  } catch {
    return false;
  }
  return true;
}
