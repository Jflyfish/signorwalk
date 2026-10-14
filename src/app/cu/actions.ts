'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  canOpenTenant,
  checkCredentials,
  CU_SESSION_COOKIE,
  demoTenantId,
  signSession,
  verifySession,
} from '@/cu/auth';
import { getBranding, saveBranding, saveSettings, type StoredBranding } from '@/cu/cu-store';
import { readLogoFile } from '@/cu/logo-file';
import { sendAggregateSummary } from '@/cu/notify';
import { getCuTenant } from '@/cu/tenants';

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
  if (!getCuTenant(tenant)) redirect(`/cu/${demoTenantId()}/sign-in?error=denied`);
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const result = checkCredentials(tenant, email, password);
  if (result.status !== 'ok') {
    redirect(`/cu/${tenant}/sign-in?error=${result.status === 'unconfigured' ? 'unconfigured' : 'denied'}`);
  }
  const token = signSession(result.session);
  if (!token) redirect(`/cu/${tenant}/sign-in?error=unconfigured`);
  const jar = await cookies();
  jar.set(CU_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: await secureCookie(),
    maxAge: 60 * 60 * 12,
  });
  if (result.session.role === 'admin') redirect('/cu/admin');
  redirect(`/cu/${tenant}/dashboard`);
}

export async function signOut(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  const dest = getCuTenant(tenant)?.id ?? demoTenantId();
  const jar = await cookies();
  jar.set(CU_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: await secureCookie(),
    maxAge: 0,
  });
  redirect(`/cu/${dest}/sign-in`);
}

async function guard(tenant: string) {
  const session = await currentSession();
  if (!getCuTenant(tenant) || !canOpenTenant(session, tenant)) redirect(`/cu/${tenant}/sign-in`);
  return session;
}

export async function saveSettingsAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guard(tenant);
  const notifyEmail = String(formData.get('notifyEmail') ?? '').trim();
  if (notifyEmail.length > 120 || (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail))) {
    redirect(`/cu/${tenant}/dashboard?section=settings&error=email`);
  }
  await saveSettings(tenant, { emailEnabled: formData.get('emailEnabled') === 'on', notifyEmail: notifyEmail || undefined });
  redirect(`/cu/${tenant}/dashboard?section=settings&saved=settings`);
}

export async function saveBrandingAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guard(tenant);
  const shortName = String(formData.get('shortName') ?? '').trim().replace(/\s+/g, ' ');
  const primary = String(formData.get('primary') ?? '').trim();
  const secondary = String(formData.get('secondary') ?? '').trim();
  const hex = /^#[0-9a-fA-F]{6}$/;
  const brandingError = `/cu/${tenant}/dashboard?section=branding&error=branding`;
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
  redirect(`/cu/${tenant}/dashboard?section=branding&saved=branding`);
}

async function logoFromForm(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) return null;
  const logo = readLogoFile(Buffer.from(await entry.arrayBuffer()), entry.type || 'application/octet-stream');
  return logo ?? 'invalid';
}

export async function sendSummaryAction(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '');
  await guard(tenant);
  try {
    const result = await sendAggregateSummary(tenant);
    if (!result.sent) redirect(`/cu/${tenant}/dashboard?section=settings&notice=${result.reason}`);
  } catch {
    redirect(`/cu/${tenant}/dashboard?section=settings&error=email`);
  }
  redirect(`/cu/${tenant}/dashboard?section=settings&saved=email`);
}
