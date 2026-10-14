import { getAggregates, getSettings, type Aggregates } from './cu-store';
import { getCuTenant } from './tenants';

/**
 * Optional aggregate email to the credit union. The tenant toggle defaults off.
 * The body is counts and the credit-union name. It has no member data.
 */

export function summaryText(name: string, agg: Aggregates): string {
  return [
    name,
    `Checks: ${agg.checks}`,
    `Uploads read: ${agg.uploads}`,
    `Grades: A ${agg.grades.A}, B ${agg.grades.B}, C ${agg.grades.C}, D ${agg.grades.D}, F ${agg.grades.F}`,
    'No member information is included.',
  ].join('\n');
}

export async function sendAggregateSummary(
  tenantId: string,
): Promise<{ sent: false; reason: 'disabled' | 'not-configured' | 'missing-tenant' } | { sent: true }> {
  const tenant = getCuTenant(tenantId);
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
