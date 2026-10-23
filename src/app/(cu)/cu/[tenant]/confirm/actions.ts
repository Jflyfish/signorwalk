'use server';

import { redirect } from 'next/navigation';
import { getTenantProfile } from '@/cu/tenant-directory';
import { confirmTrialToken } from '@/cu/trial-confirm';

export async function confirmTrial(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '').trim().toLowerCase();
  const token = String(formData.get('token') ?? '');
  const ok = await confirmTrialToken(tenant, token);
  if (!ok) redirect(tenant ? `/cu/${tenant}/dashboard` : '/credit-unions');
  const profile = await getTenantProfile(tenant);
  if (profile?.onboardingComplete === false) redirect(`/cu/${tenant}/onboarding`);
  redirect(`/cu/${tenant}/dashboard?saved=confirmed`);
}
