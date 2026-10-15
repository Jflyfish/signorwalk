import { TALK_TO_US_EMAIL } from '@/app/credit-unions/pricing';
import { getAggregates, getSettings, type Aggregates } from './cu-store';
import { loadCuTenant } from './tenant-directory';

/**
 * Optional aggregate email to the credit union. The tenant toggle defaults off.
 * The body is counts and the credit-union name. It has no member data.
 */

export function summaryText(name: string, agg: Aggregates): string {
  return [
    name,
    `Checks: ${agg.checks}`,
    `Worksheet uploads: ${agg.uploads}`,
    `Grades: A ${agg.grades.A}, B ${agg.grades.B}, C ${agg.grades.C}, D ${agg.grades.D}, F ${agg.grades.F}`,
    'No member information is included.',
  ].join('\n');
}

/** Inbox for a new trial. `CU_SIGNUP_NOTIFY_EMAIL` when it is an address, otherwise the team inbox. */
export function signupNotifyAddress(): string {
  const configured = process.env.CU_SIGNUP_NOTIFY_EMAIL?.trim() ?? '';
  if (configured.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured)) return configured;
  return TALK_TO_US_EMAIL;
}

/** Tells the team a trial started. Returns false when Resend is unset. Does not log addresses. */
export async function sendSignupNotice(name: string, id: string, tier?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || !name || !id) return false;
  const plan = tier === 'starter' || tier === 'growth' || tier === 'pro' ? tier : 'not chosen';
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: signupNotifyAddress(),
      subject: `New Sign or Walk trial — ${name}`,
      text: `${name} started a 90-day trial.\nSlug: ${id}\nTier: ${plan}\n`,
    });
    return true;
  } catch {
    return false;
  }
}

/** Optional trial note. Returns false when Resend is unset. Does not log the address. */
export async function sendTrialConfirm(to: string, name: string, url: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || !to) return false;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `Confirm your Sign or Walk trial — ${name}`,
      text: `Confirm the 90-day free trial for ${name}.\n${url}\n`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendAggregateSummary(
  tenantId: string,
): Promise<{ sent: false; reason: 'disabled' | 'not-configured' | 'missing-tenant' } | { sent: true }> {
  const tenant = await loadCuTenant(tenantId);
  if (!tenant) return { sent: false, reason: 'missing-tenant' };
  const settings = await getSettings(tenantId);
  if (!settings.emailEnabled) return { sent: false, reason: 'disabled' };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = settings.notifyEmail;
  if (!apiKey || !from || !to) return { sent: false, reason: 'not-configured' };

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const agg = await getAggregates(tenantId);
  const text = summaryText(tenant.name, agg);
  await resend.emails.send({
    from,
    to,
    subject: `Sign or Walk counts — ${tenant.name}`,
    text,
  });
  return { sent: true };
}
