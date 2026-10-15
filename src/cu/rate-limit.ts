import { createHash } from 'node:crypto';
import { incrementWindow } from './cu-store';

/**
 * Per-instance sliding window for POST /api/cu/[tenant]/analyze.
 *
 * Serverless isolates do not share this map, so a burst can land on a cold
 * instance and pass, and the window resets when the instance goes idle.
 * Production should also add a Vercel Firewall rate-limit rule on
 * POST /api/cu/{tenant}/analyze (for example 30 requests per 10 seconds per IP).
 * That rule is the shared control. This module is the stateless fallback:
 * no database, and the map stores a hash, not the address.
 */
export const ANALYZE_WINDOW_MS = 60_000;
export const ANALYZE_LIMIT = 12;

const buckets = new Map<string, number[]>();

export function clientAddress(headers: { get(name: string): string | null }): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

function bucketKey(ip: string): string {
  return createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 24);
}

export function takeAnalyzeSlot(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const key = bucketKey(ip);
  const recent = (buckets.get(key) ?? []).filter(ts => now - ts < ANALYZE_WINDOW_MS);
  if (recent.length >= ANALYZE_LIMIT) {
    const retryAfterSec = Math.max(1, Math.ceil((ANALYZE_WINDOW_MS - (now - recent[0])) / 1000));
    buckets.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 2000) {
    for (const [stored, times] of buckets) {
      if (times.every(ts => now - ts >= ANALYZE_WINDOW_MS)) buckets.delete(stored);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetAnalyzeRateLimit(): void {
  buckets.clear();
}

/** Separate window for worksheet reads. Same stateless, per-isolate limit. */
export const EXTRACT_LIMIT = 6;
const extractBuckets = new Map<string, number[]>();

export function takeExtractSlot(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const key = bucketKey(ip);
  const recent = (extractBuckets.get(key) ?? []).filter(ts => now - ts < ANALYZE_WINDOW_MS);
  if (recent.length >= EXTRACT_LIMIT) {
    const retryAfterSec = Math.max(1, Math.ceil((ANALYZE_WINDOW_MS - (now - recent[0])) / 1000));
    extractBuckets.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  extractBuckets.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

export function resetExtractRateLimit(): void {
  extractBuckets.clear();
}

/**
 * Signup window. The key is a hash of the address, not the address.
 * When Upstash or Vercel KV is set, INCR on that store is the shared counter
 * across isolates. With no store, or when the call fails, the map below is
 * the local fallback. Do not add a production Firewall rule for signup yet.
 */
export const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
export const SIGNUP_LIMIT = 5;
const signupBuckets = new Map<string, number[]>();

export async function takeSignupSlot(
  ip: string,
  now = Date.now(),
  shared: typeof incrementWindow = incrementWindow,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const key = `cu:rate:signup:${bucketKey(`signup:${ip}`)}`;
  const windowSec = Math.ceil(SIGNUP_WINDOW_MS / 1000);
  const fromStore = await shared(key, windowSec);
  if (fromStore) {
    if (fromStore.count > SIGNUP_LIMIT) {
      return { allowed: false, retryAfterSec: Math.max(1, fromStore.ttl) };
    }
    return { allowed: true, retryAfterSec: 0 };
  }
  const recent = (signupBuckets.get(key) ?? []).filter(ts => now - ts < SIGNUP_WINDOW_MS);
  if (recent.length >= SIGNUP_LIMIT) {
    const retryAfterSec = Math.max(1, Math.ceil((SIGNUP_WINDOW_MS - (now - recent[0])) / 1000));
    signupBuckets.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  signupBuckets.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

export function resetSignupRateLimit(): void {
  signupBuckets.clear();
}

/**
 * Hard cap for the public Harborlight demo, which still accepts a worksheet
 * on the member page. Marketing embed requests are refused before this runs.
 * The shared store is used when KV is set. The map is the local fallback.
 */
export const DEMO_EXTRACT_LIMIT = 2;
export const DEMO_EXTRACT_WINDOW_MS = 60 * 60 * 1000;
const demoExtractBuckets = new Map<string, number[]>();

export async function takeDemoExtractSlot(
  ip: string,
  now = Date.now(),
  shared: typeof incrementWindow = incrementWindow,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const key = `cu:rate:demo:${bucketKey(`demo:${ip}`)}`;
  const windowSec = Math.ceil(DEMO_EXTRACT_WINDOW_MS / 1000);
  const fromStore = await shared(key, windowSec);
  if (fromStore) {
    if (fromStore.count > DEMO_EXTRACT_LIMIT) {
      return { allowed: false, retryAfterSec: Math.max(1, fromStore.ttl) };
    }
    return { allowed: true, retryAfterSec: 0 };
  }
  const recent = (demoExtractBuckets.get(key) ?? []).filter(ts => now - ts < DEMO_EXTRACT_WINDOW_MS);
  if (recent.length >= DEMO_EXTRACT_LIMIT) {
    const retryAfterSec = Math.max(1, Math.ceil((DEMO_EXTRACT_WINDOW_MS - (now - recent[0])) / 1000));
    demoExtractBuckets.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  demoExtractBuckets.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

export function resetDemoExtractRateLimit(): void {
  demoExtractBuckets.clear();
}
