import { NextRequest, NextResponse } from 'next/server';

const GRADE_COLOR: Record<string, string> = {
  A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#dc2626', F: '#b91c1c',
};

const REC_LABEL: Record<string, string> = {
  sign: '✅ Sign It', negotiate: '⚠️ Negotiate First', walk: '🚶 Walk Away',
};

function buildReportHtml(email: string, grade: string, vehicle: string, analysis: Record<string, unknown>): string {
  const proLink = 'https://signorwalk.com/ask-a-pro';
  const gradeColor = GRADE_COLOR[grade] ?? '#6b7280';
  const rec = REC_LABEL[(analysis.recommendation as string) ?? ''] ?? '';
  const showProCta = ['B', 'C', 'D', 'F'].includes(grade);

  const breakdownRows = (analysis.breakdown as Array<{ label: string; value: string; status: string; explanation: string }> ?? [])
    .map(row => {
      const dot = row.status === 'good' ? '#16a34a' : row.status === 'warn' ? '#d97706' : '#dc2626';
      return `<tr>
        <td style="padding:11px 0;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot};margin-right:8px;vertical-align:middle;"></span><strong style="font-size:14px;color:#111827;">${row.label}</strong>
          &nbsp;<span style="font-size:12px;color:#374151;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:2px 7px;">${row.value}</span>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;margin-left:16px;line-height:1.5;">${row.explanation}</div>
        </td>
      </tr>`;
    }).join('');

  const redFlagBlocks = (analysis.redFlags as Array<{ issue: string; fix?: string }> ?? [])
    .map(flag => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid #fecaca;font-family:Arial,sans-serif;">
        <div style="font-size:14px;color:#991b1b;font-weight:600;line-height:1.4;">&#9888; ${flag.issue}</div>
        ${flag.fix ? `<div style="font-size:13px;color:#374151;margin-top:5px;line-height:1.5;">&#10003; ${flag.fix}</div>` : ''}
      </td>
    </tr>`).join('');

  const counterScript = (analysis.counterOfferScript as string) ?? '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Your Sign or Walk Report</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td align="center" style="padding-bottom:20px;font-family:Arial,sans-serif;">
    <div style="font-size:22px;font-weight:900;color:#111827;">Sign or Walk</div>
    <div style="font-size:13px;color:#9ca3af;margin-top:4px;">Your free deal analysis</div>
  </td></tr>

  <!-- Grade -->
  <tr><td style="background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:20px 24px;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="70" valign="top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" width="56" height="56" style="width:56px;height:56px;border-radius:28px;background:${gradeColor};font-size:28px;font-weight:900;color:#ffffff;text-align:center;line-height:56px;">${grade}</td></tr>
          </table>
        </td>
        <td valign="top" style="padding-left:14px;">
          ${rec ? `<div style="font-size:11px;font-weight:700;color:#374151;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:20px;padding:3px 10px;display:inline-block;margin-bottom:7px;">${rec}</div><br>` : ''}
          <span style="font-size:17px;font-weight:800;color:#111827;line-height:1.3;">${analysis.headline ?? ''}</span><br>
          <span style="font-size:13px;font-weight:600;color:${gradeColor};">${analysis.gradeExplanation ?? ''}</span><br><br>
          <span style="font-size:13px;color:#6b7280;line-height:1.6;">${analysis.summary ?? ''}</span>
          ${vehicle ? `<br><br><span style="font-size:12px;color:#9ca3af;">Vehicle: ${vehicle}</span>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td height="12"></td></tr>

  <!-- Top CTA -->
  ${showProCta ? `
  <tr><td align="center" style="background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;padding:20px 24px;font-family:Arial,sans-serif;">
    <div style="font-size:15px;font-weight:700;color:#1e40af;margin-bottom:6px;">Want a human to review this before you sign?</div>
    <div style="font-size:13px;color:#3b82f6;margin-bottom:16px;">Former dealership insider &middot; Save $250+ or your money back</div>
    <a href="${proLink}" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-family:Arial,sans-serif;font-weight:700;font-size:13px;text-decoration:none;border-radius:7px;padding:11px 26px;">Ask a Pro &mdash; $19 &rarr;</a>
  </td></tr>
  <tr><td height="12"></td></tr>` : ''}

  <!-- Breakdown -->
  ${breakdownRows ? `
  <tr><td style="background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:20px 24px;">
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;font-family:Arial,sans-serif;">Deal Breakdown</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${breakdownRows}</table>
  </td></tr>
  <tr><td height="12"></td></tr>` : ''}

  <!-- Red Flags -->
  ${redFlagBlocks ? `
  <tr><td style="background:#fff5f5;border-radius:10px;border:1px solid #fecaca;padding:20px 24px;">
    <div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;font-family:Arial,sans-serif;">Red Flags (${(analysis.redFlags as unknown[])?.length ?? 0})</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${redFlagBlocks}</table>
  </td></tr>
  <tr><td height="12"></td></tr>` : ''}

  <!-- Counter-offer script -->
  ${counterScript ? `
  <tr><td style="background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:20px 24px;font-family:Arial,sans-serif;">
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Counter-Offer Script</div>
    <div style="font-size:14px;color:#374151;line-height:1.8;font-style:italic;border-left:3px solid #3b82f6;padding-left:14px;">${counterScript}</div>
  </td></tr>
  <tr><td height="12"></td></tr>` : ''}

  <!-- Bottom CTA -->
  ${showProCta ? `
  <tr><td align="center" style="background:#111827;border-radius:10px;padding:28px 24px;font-family:Arial,sans-serif;">
    <div style="font-size:11px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Optional &middot; $19</div>
    <div style="font-size:17px;font-weight:800;color:#ffffff;margin-bottom:10px;line-height:1.4;">Want a human to pressure-test this?</div>
    <div style="font-size:13px;color:#9ca3af;margin-bottom:22px;line-height:1.6;">A former dealership insider will verify your numbers and tell you word-for-word what to say. Save $250+ or your money back.</div>
    <a href="${proLink}" style="display:inline-block;background:#3b82f6;color:#ffffff;font-family:Arial,sans-serif;font-weight:700;font-size:14px;text-decoration:none;border-radius:7px;padding:13px 28px;">Ask a Pro &mdash; $19 &rarr;</a>
    <div style="font-size:12px;color:#6b7280;margin-top:12px;">Reply within 4 hours (8&nbsp;AM&ndash;6&nbsp;PM ET) or next business day</div>
  </td></tr>
  <tr><td height="24"></td></tr>` : ''}

  <!-- Footer -->
  <tr><td align="center" style="font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.7;">
    <strong style="color:#6b7280;">Sign or Walk</strong> &middot; signorwalk.com<br>
    AI-generated for informational purposes only. Not financial or legal advice.<br>
    Always verify numbers with your dealer before signing.
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const { email, grade, vehicle, analysis } = await req.json();
  if (!email) return NextResponse.json({ success: false }, { status: 400 });

  console.log(`[email-capture] ${email} | grade: ${grade ?? '?'} | vehicle: ${vehicle ?? '?'}`);

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const reportHtml = analysis
      ? buildReportHtml(email, grade, vehicle, analysis as Record<string, unknown>)
      : null;

    await Promise.allSettled([
      // Lead notification to team
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Sign or Walk <noreply@signorwalk.com>',
          to: ['team@signorwalk.com'],
          subject: `⚡ Action Required — New deal review: ${grade ?? '?'} grade${vehicle ? ` · ${vehicle}` : ''}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;">
              <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
                <span style="font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">⚡ Action Required</span>
                <p style="margin:6px 0 0;font-size:14px;color:#78350f;">A new lead came in. Follow up within 4 hours for best conversion.</p>
              </div>
              <table style="font-size:14px;border-collapse:collapse;width:100%;">
                <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;">Email</td><td style="font-weight:600;color:#111827;">${email}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;">Grade</td><td style="font-weight:600;color:#111827;">${grade ?? 'pending'}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;">Vehicle</td><td style="font-weight:600;color:#111827;">${vehicle ?? 'unknown'}</td></tr>
              </table>
            </div>
          `,
        }),
      }),

      // Full report to the user
      reportHtml
        ? fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Sign or Walk <noreply@signorwalk.com>',
              to: [email],
              subject: `Your car deal graded ${grade ?? '?'} — full report inside`,
              html: reportHtml,
            }),
          })
        : Promise.resolve(),
    ]);
  }

  return NextResponse.json({ success: true });
}
