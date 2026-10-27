'use server';

import { cookies } from 'next/headers';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { deriveBrand, parseHex, safeLogo } from '@/cu/contrast';
import { CuStoreUnconfigured, getBranding, saveBranding, type StoredBranding } from '@/cu/cu-store';
import { HTTPS_LINK, LOAN_LINK_REQUIRED } from '@/cu/form-copy';
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

/** Step 3 and a completed setup both require a saved https loan URL. */
function onboardingLoanReady(profile: { preApprovalUrl: string; loanLinksSet?: boolean } | null, step: 1 | 2 | 3, complete = false): boolean {
  if (step < 3 && !complete) return true;
  return Boolean(profile && profile.loanLinksSet === true && httpsUrl(profile.preApprovalUrl));
}

export async function saveOnboardingBrand(
  tenant: string,
  logoUrl: string,
  color: string,
  shortNameInput = '',
): Promise<{ ok: true; primary: string } | { ok: false; error: string }> {
  if (!(await staffCanEdit(tenant))) return { ok: false, error: 'Sign in to continue.' };
  const trimmedLogo = logoUrl.trim();
  let logo = '';
  if (trimmedLogo) {
    if (/^http:\/\//i.test(trimmedLogo) || !httpsUrl(trimmedLogo)) return { ok: false, error: HTTPS_LINK };
    const safe = safeLogo(trimmedLogo);
    if (!safe?.startsWith('https:')) return { ok: false, error: HTTPS_LINK };
    logo = safe;
  }
  if (!parseHex(color)) return { ok: false, error: 'Enter a color like #075985.' };
  const profile = await getTenantProfile(tenant);
  if (!profile) return { ok: false, error: 'This credit union was not found.' };
  const current = await getBranding(tenant);
  const requested = shortNameInput.trim().replace(/\s+/g, ' ');
  if ([...requested].length > 24) return { ok: false, error: 'Short name can be at most 24 characters.' };
  let shortName = requested;
  if (!shortName) {
    const currentShort = current?.shortName?.trim() ?? '';
    if (currentShort && [...currentShort].length <= 24) shortName = currentShort;
    else if ([...profile.name].length <= 24) shortName = profile.name;
  }
  const derived = deriveBrand(tenant, {
    name: profile.name,
    shortName,
    primary: color.trim(),
    logoLight: logo || undefined,
    logoAspect: current?.logoAspect || 1,
    font: 'inter',
  }, () => undefined);
  const branding: StoredBranding = {
    ...current,
    shortName: shortName || undefined,
    primary: derived.brandFill,
    logoLight: logo || undefined,
    font: 'inter',
  };
  try {
    await saveBranding(tenant, branding);
    if (!profile.onboardingStep) profile.onboardingStep = 1;
    await saveTenantProfile(profile);
  } catch (error) {
    if (error instanceof CuStoreUnconfigured) return { ok: false, error: error.message };
    return { ok: false, error: 'That logo or color could not be saved.' };
  }
  return { ok: true, primary: derived.brandFill };
}

export async function saveOnboardingLoan(
  tenant: string,
  loanUrl: string,
  disclosure: string,
  ratesUrl = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await staffCanEdit(tenant))) return { ok: false, error: 'Sign in to continue.' };
  const loan = loanUrl.trim();
  if (!loan) return { ok: false, error: LOAN_LINK_REQUIRED };
  if (/^http:\/\//i.test(loan) || !httpsUrl(loan)) return { ok: false, error: HTTPS_LINK };
  const rates = ratesUrl.trim();
  if (rates && (/^http:\/\//i.test(rates) || !httpsUrl(rates))) return { ok: false, error: HTTPS_LINK };
  const line = disclosure.trim().replace(/\s+/g, ' ').slice(0, 180);
  const profile = await getTenantProfile(tenant);
  if (!profile) return { ok: false, error: 'This credit union was not found.' };
  profile.preApprovalUrl = loan;
  profile.loanLinksSet = true;
  profile.ratesUrl = rates;
  profile.ratesLinkSet = Boolean(rates);
  profile.disclosure = line || undefined;
  if (!profile.onboardingStep || profile.onboardingStep < 2) profile.onboardingStep = 2;
  try {
    await saveTenantProfile(profile);
  } catch (error) {
    if (error instanceof CuStoreUnconfigured) return { ok: false, error: error.message };
    return { ok: false, error: 'That line could not be saved.' };
  }
  return { ok: true };
}

export async function saveOnboardingStep(tenant: string, step: 1 | 2 | 3, complete = false): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await staffCanEdit(tenant))) return { ok: false, error: 'Sign in to continue.' };
  const profile = await getTenantProfile(tenant);
  if (!profile) return { ok: false, error: 'This credit union was not found.' };
  if (!onboardingLoanReady(profile, step, complete)) return { ok: false, error: LOAN_LINK_REQUIRED };
  profile.onboardingStep = step;
  if (complete) profile.onboardingComplete = true;
  try {
    await saveTenantProfile(profile);
  } catch (error) {
    if (error instanceof CuStoreUnconfigured) return { ok: false, error: error.message };
    return { ok: false, error: 'That line could not be saved.' };
  }
  return { ok: true };
}
