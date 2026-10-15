'use server';

import { redirect } from 'next/navigation';
import { confirmTrialToken } from '@/cu/trial-confirm';

export async function confirmTrial(formData: FormData) {
  const tenant = String(formData.get('tenant') ?? '').trim().toLowerCase();
  const token = String(formData.get('token') ?? '');
  const ok = await confirmTrialToken(tenant, token);
  if (!ok) redirect(tenant ? `/cu/${tenant}/dashboard` : '/credit-unions');
  redirect(`/cu/${tenant}/dashboard?saved=confirmed`);
}
