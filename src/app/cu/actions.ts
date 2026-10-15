'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { canOpenTenant, checkCredentials, CU_SESSION_COOKIE, demoTenantId, signSession, verifySession, type CuSession } from '@/cu/auth';
import { appendAudit, getBranding, getSettings, saveBranding, saveSettings, type StoredBranding } from '@/cu/cu-store';
import { requestOriginFrom } from '@/cu/embed';
import { readLogoFile } from '@/cu/logo-file';
import { sendAggregateSummary, sendTrialConfirm } from '@/cu/notify';
import { readStaffEmail, staffLoginMatches } from '@/cu/staff-login';
import { rotateConfirmToken } from '@/cu/trial';
import {
  getTenantProfile,
  loadCuTenant,
  normalizeProfile,
  parseEmbedOrigins,
  removalConfirmed,
  removalIdMatches,
  removeTenant,
  replaceEmbedOrigins,
  saveTenantProfile,
  setTenantStatus,
  tenantBrandOk,
} from '@/cu/tenant-directory';

async function secureCookie(): Promise<boolean> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) return proto === 'https';
  const host = h.get('host') ?? '';
  return !host.startsWith('127.0.0.1') && !host.startsWith('localhost');
}

async function currentSession() {
  const jar = await cookies();
  return verifySession(jar.get(CU_SESSION_COOKIE)?.value);
}

export async function signIn(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '').trim().toLowerCase();
  if (!(await loadCuTenant(tenant))) redirect(`/cu/${demoTenantId()}/sign-in?error=denied`);
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const result = checkCredentials(tenant, email, password);
  const staff = result.status === 'ok' ? false : await staffLoginMatches(tenant, email, password);
  if (result.status !== 'ok' && !staff) {
    const missingSecret = !process.env.CU_SESSION_SECRET;
    redirect(`/cu/${tenant}/sign-in?error=${result.status === 'unconfigured' || missingSecret ? 'unconfigured' : 'denied'}`);
  }
  const session = result.status === 'ok'
    ? result.session
    : { role: 'cu' as const, tenantId: tenant, exp: Date.now() + 60 * 60 * 12 * 1000 };
  const token = signSession(session);
  if (!token) redirect(`/cu/${tenant}/sign-in?error=unconfigured`);
  const jar = await cookies();
  jar.set(CU_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: await secureCookie(),
    maxAge: 60 * 60 * 12,
  });
  if (session.role === 'admin') redirect('/cu/admin');
  redirect(`/cu/${tenant}/dashboard`);
}

export async function signOut(formData: FormData) {
  const session = await currentSession();
  const tenant = String(formData.get('tenant') ?? '');
  const dest = (await loadCuTenant(tenant))?.id ?? demoTenantId();
  const jar = await cookies();
  jar.set(CU_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: await secureCookie(),
    maxAge: 0,
  });
  if (session?.role === 'admin') redirect('/credit-unions');
  redirect(`/cu/${dest}/sign-in`);
}

async function guard(tenant: string): Promise<CuSession> {
  const session = await currentSession();
  const record = await loadCuTenant(tenant);
  if (!record || !session || !canOpenTenant(session, tenant)) redirect(`/cu/${tenant}/sign-in`);
  return session;
}

async function guardMutable(tenant: string): Promise<CuSession> {
  const session = await guard(tenant);
  if (session.role === 'admin') return session;
  const profile = await getTenantProfile(tenant);
  if (profile?.verified === false) redirect(`/cu/${tenant}/dashboard?notice=confirm`);
  return session;
}

async function ownerOnly(): Promise<void> {
  const session = await currentSession();
  if (!session) redirect(`/cu/${demoTenantId()}/sign-in`);
  if (session.role !== 'admin') redirect(`/cu/${session.tenantId}/dashboard`);
}

function emailOk(value: string): boolean {
  return value.length <= 120 && (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export async function resendConfirmAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guard(tenant);
  const profile = await getTenantProfile(tenant);
  if (!profile || profile.verified !== false) redirect(`/cu/${tenant}/dashboard`);
  const email = await readStaffEmail(tenant);
  const h = await headers();
  const origin = requestOriginFrom(name => h.get(name));
  if (!email || !origin) redirect(`/cu/${tenant}/dashboard?notice=mail`);
  const token = await rotateConfirmToken(tenant);
  if (!token) redirect(`/cu/${tenant}/dashboard?notice=mail`);
  const sent = await sendTrialConfirm(email, profile.name, `${origin}/cu/${tenant}/confirm?token=${token}`);
  redirect(`/cu/${tenant}/dashboard?notice=${sent ? 'sent' : 'mail'}`);
}

export async function saveSettingsAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guardMutable(tenant);
  const notifyEmail = String(formData.get('notifyEmail') ?? '').trim();
  if (notifyEmail.length > 120 || (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail))) {
    redirect(`/cu/${tenant}/dashboard?section=settings&error=email`);
  }
  await saveSettings(tenant, { emailEnabled: formData.get('emailEnabled') === 'on', notifyEmail: notifyEmail || undefined });
  redirect(`/cu/${tenant}/dashboard?section=settings&saved=settings`);
}

export async function saveLoanLinksAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guardMutable(tenant);
  const current = await getTenantProfile(tenant);
  if (!current) redirect(`/cu/${tenant}/dashboard?error=links`);
  const profile = normalizeProfile({
    ...current,
    preApprovalUrl: String(formData.get('preApprovalUrl') ?? ''),
    ratesUrl: String(formData.get('ratesUrl') ?? ''),
    loanLinksSet: true,
  });
  if (!profile) redirect(`/cu/${tenant}/dashboard?error=links`);
  profile.confirmHash = current.confirmHash;
  profile.verified = current.verified;
  profile.tier = current.tier;
  try {
    await saveTenantProfile(profile);
  } catch {
    redirect(`/cu/${tenant}/dashboard?error=links`);
  }
  redirect(`/cu/${tenant}/dashboard?saved=links`);
}

export async function saveEmbedOriginsAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guardMutable(tenant);
  const origins = parseEmbedOrigins(String(formData.get('embedOrigins') ?? ''));
  if (!origins) redirect(`/cu/${tenant}/dashboard?section=embed&error=origins`);
  try {
    await replaceEmbedOrigins(tenant, origins);
  } catch {
    redirect(`/cu/${tenant}/dashboard?section=embed&error=origins`);
  }
  redirect(`/cu/${tenant}/dashboard?section=embed&saved=origins`);
}

export async function saveBrandingAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  const session = await guardMutable(tenant);
  const owner = session.role === 'admin' && formData.get('returnTo') === 'owner';
  const shortName = String(formData.get('shortName') ?? '').trim().replace(/\s+/g, ' ');
  const primary = String(formData.get('primary') ?? '').trim();
  const secondary = String(formData.get('secondary') ?? '').trim();
  const hex = /^#[0-9a-fA-F]{6}$/;
  const brandingError = owner
    ? `/cu/admin?cu=${tenant}&error=branding`
    : `/cu/${tenant}/dashboard?section=branding&error=branding`;
  if ([...shortName].length < 1 || [...shortName].length > 24 || !hex.test(primary)) redirect(brandingError);
  if (secondary && !hex.test(secondary)) redirect(brandingError);
  const light = await logoFromForm(formData.get('logoLightFile'));
  const dark = await logoFromForm(formData.get('logoDarkFile'));
  if (light === 'invalid' || dark === 'invalid') redirect(brandingError);
  const current = await getBranding(tenant);
  const branding: StoredBranding = {
    shortName,
    primary,
    secondary: secondary || undefined,
    logoLight: light?.dataUrl ?? current?.logoLight,
    logoDark: dark?.dataUrl ?? current?.logoDark,
    logoAspect: light?.aspect ?? dark?.aspect ?? current?.logoAspect,
    font: 'inter',
  };
  try {
    await saveBranding(tenant, branding);
  } catch {
    redirect(brandingError);
  }
  await appendAudit('branding', tenant, owner ? 'owner' : 'tenant');
  redirect(owner ? `/cu/admin?cu=${tenant}&saved=branding` : `/cu/${tenant}/dashboard?section=branding&saved=branding`);
}

async function logoFromForm(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) return null;
  const logo = readLogoFile(Buffer.from(await entry.arrayBuffer()), entry.type || 'application/octet-stream');
  return logo ?? 'invalid';
}

export async function sendSummaryAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guardMutable(tenant);
  try {
    const result = await sendAggregateSummary(tenant);
    if (!result.sent) redirect(`/cu/${tenant}/dashboard?section=settings&notice=${result.reason}`);
  } catch {
    redirect(`/cu/${tenant}/dashboard?section=settings&error=email`);
  }
  redirect(`/cu/${tenant}/dashboard?section=settings&saved=email`);
}

export async function createOwnerTenantAction(formData: FormData) {
  await ownerOnly();
  const id = String(formData.get('id') ?? '');
  const shortName = String(formData.get('shortName') ?? '');
  const primary = String(formData.get('primary') ?? '').trim();
  const profile = normalizeProfile({
    id,
    name: String(formData.get('name') ?? ''),
    legalName: String(formData.get('legalName') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    supportUrl: String(formData.get('supportUrl') ?? ''),
    privacyUrl: String(formData.get('privacyUrl') ?? ''),
    preApprovalUrl: String(formData.get('preApprovalUrl') ?? ''),
    ratesUrl: String(formData.get('ratesUrl') ?? ''),
    preApprovalLabel: String(formData.get('preApprovalLabel') ?? ''),
    ratesLabel: String(formData.get('ratesLabel') ?? ''),
    embedOrigins: [],
    status: 'active',
    shortName,
  });
  if (!profile || !tenantBrandOk(profile.id, shortName, primary) || await loadCuTenant(profile.id)) {
    redirect('/cu/admin?cu=new&error=profile');
  }
  try {
    await saveTenantProfile(profile, { shortName, primary });
  } catch {
    redirect('/cu/admin?cu=new&error=profile');
  }
  await appendAudit('create', profile.id, 'owner');
  redirect(`/cu/admin?cu=${profile.id}&need=site#embed-allowlist`);
}

export async function saveOwnerProfileAction(formData: FormData) {
  await ownerOnly();
  const id = String(formData.get('tenant') ?? '');
  const current = await getTenantProfile(id);
  if (!current) redirect('/cu/admin?error=missing');
  const profile = normalizeProfile({
    ...current,
    name: String(formData.get('name') ?? ''),
    legalName: String(formData.get('legalName') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    supportUrl: String(formData.get('supportUrl') ?? ''),
    privacyUrl: String(formData.get('privacyUrl') ?? ''),
    preApprovalUrl: String(formData.get('preApprovalUrl') ?? ''),
    ratesUrl: String(formData.get('ratesUrl') ?? ''),
    preApprovalLabel: String(formData.get('preApprovalLabel') ?? ''),
    ratesLabel: String(formData.get('ratesLabel') ?? ''),
    shortName: current.name,
  });
  if (!profile) redirect(`/cu/admin?cu=${id}&error=profile`);
  profile.loanLinksSet = true;
  profile.tier = current.tier;
  profile.confirmHash = current.confirmHash;
  profile.verified = current.verified;
  try {
    await saveTenantProfile(profile);
  } catch {
    redirect(`/cu/admin?cu=${id}&error=profile`);
  }
  await appendAudit('profile', id, 'owner');
  redirect(`/cu/admin?cu=${id}&saved=profile`);
}

export async function saveOwnerSettingsAction(formData: FormData) {
  await ownerOnly();
  const id = String(formData.get('tenant') ?? '');
  if (!(await loadCuTenant(id))) redirect('/cu/admin?error=missing');
  const notifyEmail = String(formData.get('notifyEmail') ?? '').trim();
  const origins = parseEmbedOrigins(String(formData.get('embedOrigins') ?? ''));
  if (!emailOk(notifyEmail) || !origins) redirect(`/cu/admin?cu=${id}&error=settings`);
  const previous = await getSettings(id);
  try {
    await saveSettings(id, { emailEnabled: formData.get('emailEnabled') === 'on', notifyEmail: notifyEmail || undefined });
    await replaceEmbedOrigins(id, origins);
  } catch {
    await saveSettings(id, previous);
    redirect(`/cu/admin?cu=${id}&error=settings`);
  }
  await appendAudit('settings', id, 'owner');
  redirect(`/cu/admin?cu=${id}&saved=settings`);
}

export async function setOwnerStatusAction(formData: FormData) {
  await ownerOnly();
  const id = String(formData.get('tenant') ?? '');
  const status = formData.get('status') === 'paused' ? 'paused' : formData.get('status') === 'active' ? 'active' : null;
  if (!status || !(await loadCuTenant(id))) redirect('/cu/admin?error=missing');
  if (status === 'paused' && String(formData.get('confirm') ?? '') !== 'pause') {
    redirect(`/cu/admin?cu=${id}&confirm=pause`);
  }
  try {
    await setTenantStatus(id, status);
  } catch {
    redirect(`/cu/admin?cu=${id}&error=profile`);
  }
  await appendAudit(status === 'paused' ? 'pause' : 'resume', id, 'owner');
  redirect(`/cu/admin?cu=${id}&saved=${status === 'paused' ? 'paused' : 'resumed'}`);
}

export async function removeTenantAction(formData: FormData) {
  await ownerOnly();
  const id = String(formData.get('tenant') ?? '');
  const typed = String(formData.get('confirmId') ?? '');
  if (!removalConfirmed(String(formData.get('confirm') ?? '')) || !removalIdMatches(typed, id)) {
    redirect(`/cu/admin?cu=${id}&confirm=remove&error=confirm`);
  }
  if (!(await loadCuTenant(id))) redirect('/cu/admin?error=missing');
  await removeTenant(id);
  await appendAudit('remove', id, 'owner');
  redirect('/cu/admin?removed=1');
}
