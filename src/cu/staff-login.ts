import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { deleteStoreKey, readStoreJson, storeKey, writeStoreJson } from './cu-store';

const scryptAsync = promisify(scrypt);
const KEYLEN = 32;

interface StaffRecord {
  email: string;
  hash: string;
}

/** scrypt hash. The stored text does not include the secret. */
export async function hashStaffSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(secret, salt, KEYLEN) as Buffer;
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyStaffSecret(secret: string, stored: string): Promise<boolean> {
  const [kind, saltHex, hashHex] = stored.split(':');
  if (kind !== 'scrypt' || !saltHex || !hashHex) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, 'hex');
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;
  const derived = await scryptAsync(secret, salt, expected.length) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function saveStaffLogin(tenantId: string, email: string, secret: string): Promise<void> {
  const hash = await hashStaffSecret(secret);
  const record: StaffRecord = { email: email.trim().toLowerCase(), hash };
  await writeStoreJson(storeKey(tenantId, 'staff'), record);
}

export async function staffLoginMatches(tenantId: string, email: string, secret: string): Promise<boolean> {
  const record = await readStoreJson<StaffRecord>(storeKey(tenantId, 'staff'));
  if (!record || record.email !== email.trim().toLowerCase() || typeof record.hash !== 'string') return false;
  return verifyStaffSecret(secret, record.hash);
}

export async function readStaffEmail(tenantId: string): Promise<string | null> {
  const record = await readStoreJson<StaffRecord>(storeKey(tenantId, 'staff'));
  return record?.email ?? null;
}

export async function deleteStaffLogin(tenantId: string): Promise<void> {
  await deleteStoreKey(storeKey(tenantId, 'staff'));
}
