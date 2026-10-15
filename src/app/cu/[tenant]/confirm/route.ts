import { createHash, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { getTenantProfile, saveTenantProfile } from '@/cu/tenant-directory';

export const dynamic = 'force-dynamic';

function tokensMatch(token: string, hash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(hash)) return false;
  const got = createHash('sha256').update(token).digest();
  const expected = Buffer.from(hash, 'hex');
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function GET(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const id = (await params).tenant;
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const profile = await getTenantProfile(id);
  if (!profile?.confirmHash || !tokensMatch(token, profile.confirmHash)) {
    redirect(profile ? `/cu/${profile.id}/dashboard` : '/credit-unions');
  }
  profile.verified = true;
  delete profile.confirmHash;
  await saveTenantProfile(profile);
  redirect(`/cu/${profile.id}/dashboard?saved=confirmed`);
}
