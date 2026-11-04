import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Dashboard credentials are read from the environment at request time.
 * This file has no passwords, and nothing here may log an email or a password.
 *
 * CU_DEMO_EMAIL, CU_DEMO_PASSWORD — one credit-union account
 * CU_DEMO_TENANT — optional slug, harborlight-cu when unset
 * CU_ADMIN_EMAIL, CU_ADMIN_PASSWORD — one admin for every tenant
 * CU_SESSION_SECRET — signs the session cookie
 */
export const CU_SESSION_COOKIE = 'sow_cu_session';
export const CU_CREDENTIAL_ENV = [
  'CU_DEMO_EMAIL',
  'CU_DEMO_PASSWORD',
  'CU_DEMO_TENANT',
  'CU_ADMIN_EMAIL',
  'CU_ADMIN_PASSWORD',
  'CU_SESSION_SECRET',
] as const;

const SESSION_MS = 12 * 60 * 60 * 1000;

export interface CuSession {
  role: 'cu' | 'admin';
  tenantId: string;
  exp: number;
}

export type CredentialResult =
  | { status: 'ok'; session: CuSession }
  | { status: 'denied' }
  | { status: 'unconfigured' };

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function demoTenantId(): string {
  return (process.env.CU_DEMO_TENANT || 'harborlight-cu').trim().toLowerCase();
}

export function authConfigured(): boolean {
  return Boolean(
    process.env.CU_SESSION_SECRET &&
      process.env.CU_DEMO_EMAIL &&
      process.env.CU_DEMO_PASSWORD &&
      process.env.CU_ADMIN_EMAIL &&
      process.env.CU_ADMIN_PASSWORD,
  );
}

export function checkCredentials(tenantId: string, email: string, password: string): CredentialResult {
  if (!authConfigured()) return { status: 'unconfigured' };
  const demoEmail = process.env.CU_DEMO_EMAIL ?? '';
  const demoPassword = process.env.CU_DEMO_PASSWORD ?? '';
  const adminEmail = process.env.CU_ADMIN_EMAIL ?? '';
  const adminPassword = process.env.CU_ADMIN_PASSWORD ?? '';
  const exp = Date.now() + SESSION_MS;
  const admin = safeEqual(email, adminEmail) && safeEqual(password, adminPassword);
  if (admin) return { status: 'ok', session: { role: 'admin', tenantId, exp } };
  const demo = safeEqual(email, demoEmail) && safeEqual(password, demoPassword) && tenantId === demoTenantId();
  if (demo) return { status: 'ok', session: { role: 'cu', tenantId, exp } };
  safeEqual(password, demoPassword);
  safeEqual(password, adminPassword);
  return { status: 'denied' };
}

export function signSession(session: CuSession, secret = process.env.CU_SESSION_SECRET): string | null {
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySession(token: string | undefined, now = Date.now()): CuSession | null {
  const secret = process.env.CU_SESSION_SECRET;
  if (!secret || !token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString()) as CuSession;
    if (parsed.role !== 'cu' && parsed.role !== 'admin') return null;
    if (typeof parsed.tenantId !== 'string' || typeof parsed.exp !== 'number') return null;
    if (parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function canOpenTenant(session: CuSession | null, tenantId: string): boolean {
  if (!session) return false;
  if (session.role === 'admin') return true;
  return session.role === 'cu' && session.tenantId === tenantId;
}

/** Used by tests to build a secret without writing one into the repository. */
export function ephemeralSecret(): string {
  return randomBytes(32).toString('hex');
}
