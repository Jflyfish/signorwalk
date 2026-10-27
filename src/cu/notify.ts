import { TALK_TO_US_EMAIL } from '../app/(cu)/credit-unions/pricing';
import { getSettings, getTenantCounters } from './cu-store';
import { loadCuTenant } from './tenant-directory';

/**
 * Optional count email to the credit union. The tenant toggle defaults off.
 * The body matches the dashboard labels. It has no member data.
 */

export function summaryText(name: string, counters: { gradesRun: number; loanClicks: number }): string {
  return [
    name,
    `Grades run: ${counters.gradesRun}`,
    `Loan button clicks (not applications or unique members): ${counters.loanClicks}`,
    'Grades describe offers, not members.',
  ].join('\n');
}

/** Inbox for a new trial. The notice goes to team@signorwalk.com. */
export function signupNotifyAddress(): string {
  return TALK_TO_US_EMAIL;
}

/** Tells the team a trial started. Returns false when Resend is unset. Does not log addresses. */
export async function sendSignupNotice(name: string, id: string, tier?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = signupNotifyAddress();
  if (!apiKey || !from || !name || !id || !to) return false;
  const plan = tier === 'starter' || tier === 'growth' || tier === 'pro' ? tier : 'not chosen';
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
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
  const counters = await getTenantCounters(tenantId);
  const text = summaryText(tenant.name, counters);
  await resend.emails.send({
    from,
    to,
    subject: `Sign or Walk counts — ${tenant.name}`,
    text,
  });
  return { sent: true };
}
