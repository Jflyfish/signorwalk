import { DOCUMENT_VERSION_LABEL, TALK_TO_US_EMAIL } from '../../app/credit-unions/pricing';
import { OWNER_OPEN_ITEMS } from '../owner-open-items';

export interface DueDiligenceDoc {
  slug: string;
  title: string;
  description: string;
  filename: string;
  contentType: string;
  fileKind: string;
  body: string;
}

const DRAFT_BANNER = `PILOT-ONLY, PENDING COUNSEL REVIEW.
${DOCUMENT_VERSION_LABEL.toUpperCase()}
Status: draft of what this build does. Pending counsel review.
This file is not an audit, not a certification, not a signed agreement, and not legal advice.
Items marked [To be completed] have no answer yet. A blank is not a "no."
Items marked [Draft design] describe behavior in this codebase. They are not a control attestation.
Contact: ${TALK_TO_US_EMAIL}
Date: 2026-10-15
Product: Sign or Walk white-label service for credit unions
`;

function draftMarkdown(title: string, body: string): string {
  return `${DRAFT_BANNER}\n# ${title}\n\n${body.trim()}\n`;
}

const dataFlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="520" viewBox="0 0 960 520" role="img" aria-labelledby="dfTitle dfDesc">
  <title id="dfTitle">Sign or Walk credit-union data-flow diagram, draft v0.9</title>
  <desc id="dfDesc">A member enters dealer-quote numbers, or optionally uploads a worksheet image or PDF. The file, which may include a name or VIN, is sent to Anthropic for that request and is not stored by this application. The grade comes from rules here. There is no connection to the core, online banking, or loan origination, and no database of member quotes. This pilot does not use zero data retention.</desc>
  <rect width="960" height="520" fill="#f8fafc"/>
  <rect width="960" height="72" fill="#111827"/>
  <text x="36" y="44" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700">Data-flow diagram</text>
  <text x="780" y="44" fill="#dbeafe" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700">Draft v0.9</text>
  <g font-family="Inter, system-ui, sans-serif">
    <rect x="36" y="104" width="250" height="220" rx="16" fill="#ffffff" stroke="#d1d5db"/>
    <text x="56" y="136" fill="#1d4ed8" font-size="13" font-weight="700">1 · MEMBER</text>
    <text x="56" y="168" fill="#111827" font-size="20" font-weight="700">Browser</text>
    <text x="56" y="202" fill="#374151" font-size="15">Enters the dealer quote</text>
    <text x="56" y="228" fill="#374151" font-size="15">No account</text>
    <text x="56" y="254" fill="#374151" font-size="15">Form does not ask a name</text>
    <text x="56" y="280" fill="#374151" font-size="15">Worksheet upload is optional</text>
    <rect x="330" y="104" width="280" height="220" rx="16" fill="#ffffff" stroke="#d1d5db"/>
    <text x="350" y="136" fill="#1d4ed8" font-size="13" font-weight="700">2 · SIGN OR WALK</text>
    <text x="350" y="168" fill="#111827" font-size="20" font-weight="700">Branded page</text>
    <text x="350" y="202" fill="#374151" font-size="15">Grade and markup flags</text>
    <text x="350" y="228" fill="#374151" font-size="15">Quote is not stored</text>
    <text x="350" y="254" fill="#374151" font-size="15">File sent to Anthropic</text>
    <text x="350" y="280" fill="#374151" font-size="15">Opened at /cu/your-name</text>
    <rect x="654" y="104" width="270" height="220" rx="16" fill="#ffffff" stroke="#d1d5db"/>
    <text x="674" y="136" fill="#1d4ed8" font-size="13" font-weight="700">3 · CREDIT UNION</text>
    <text x="674" y="168" fill="#111827" font-size="20" font-weight="700">Your website</text>
    <text x="674" y="202" fill="#374151" font-size="15">Your pre-approval URL</text>
    <text x="674" y="228" fill="#374151" font-size="15">Your rates URL</text>
    <text x="674" y="254" fill="#374151" font-size="15">Application stays with you</text>
    <text x="674" y="280" fill="#374151" font-size="15">Your existing pages</text>
    <line x1="286" y1="214" x2="322" y2="214" stroke="#1d4ed8" stroke-width="2"/>
    <polygon points="322,208 334,214 322,220" fill="#1d4ed8"/>
    <text x="294" y="196" fill="#1e3a8a" font-size="12" font-weight="700">In</text>
    <line x1="610" y1="214" x2="646" y2="214" stroke="#1d4ed8" stroke-width="2"/>
    <polygon points="646,208 658,214 646,220" fill="#1d4ed8"/>
    <text x="616" y="196" fill="#1e3a8a" font-size="12" font-weight="700">Out</text>
  </g>
  <rect x="36" y="352" width="888" height="132" rx="16" fill="#111827"/>
  <text x="60" y="392" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700">Not connected to the core</text>
  <text x="60" y="424" fill="#e5e7eb" font-family="Inter, system-ui, sans-serif" font-size="15">No connection to the core, online banking, or loan origination.</text>
  <text x="60" y="450" fill="#e5e7eb" font-family="Inter, system-ui, sans-serif" font-size="15">Pilot-only, pending counsel review. Draft v0.9. Not an attestation.</text>
</svg>`;

const securityQuestionnaire = draftMarkdown(
  'Security questionnaire',
  `
Placeholder in the shape of a short vendor questionnaire. It is not a completed SIG, CAIQ, or SOC report.

## 1. Organization

1.1 Legal name
Answer: [To be completed]

1.2 Headquarters and year formed
Answer: [To be completed]

1.3 Primary contact for vendor risk
Answer: [Draft design] ${TALK_TO_US_EMAIL}

1.4 Insurance (cyber, technology E&amp;O)
Answer: [To be completed] Do not read this draft as evidence of a policy or a limit.

1.5 SOC 2, ISO 27001, or similar
Answer: [To be completed] This draft does not claim a report. Hosting and AI vendors may have their own reports. Obtaining those reports, and any carve-out language, is still open.

1.6 Independent penetration test or external scan
Answer: [To be completed]

## 2. Service

2.1 What does the credit-union service do?
Answer: [Draft design] A member enters figures from a dealer auto quote on a page branded for the credit union. The page shows an educational grade and markup flags, then links to the credit union's own pre-approval and auto-rate pages. Sign or Walk is not a lender and does not take the application.

2.2 Who is the user?
Answer: [Draft design] A person using the credit union's branded page. The service does not ask the person to identify themselves as a member.

## 3. Data

3.1 Is member nonpublic personal information stored?
Answer: [Draft design] The member form does not ask for name, email, address, phone, Social Security number, account number, member number, or date of birth. A worksheet image or PDF may include a member name and VIN. That file is sent to Anthropic for the request and is not stored by this application. Staff trial records store the credit union name, a contact name, a work email, and a scrypt hash of the staff login. The store also holds branding, settings, aggregate grade counts, and audit lines (time, action, id, who). Whether a worksheet that contains a name or VIN is nonpublic personal information under the credit union's GLBA program is [To be completed] by the owner.

3.2 Are quote numbers stored?
Answer: [Draft design] Quote figures are used to produce the result for that visit. They are not written to an application database as a member file. Aggregate counts record how many checks returned each grade. They do not record the quote.

3.3 Are documents or photos of contracts uploaded?
Answer: [Draft design] Optional, on the member page. Every upload sends the full worksheet image, which may include a name or VIN, to Anthropic. Sign or Walk does not store that file. The Harborlight marketing embed hides that upload. The grade is produced by rules in this application (template pack tp-1.0.0). A model does not write the sentences a member reads.

3.4 Is there an email gate or a report emailed to the member?
Answer: [Draft design] No email is required to see a grade. Staff trial email is separate: a confirmation link, a signup notice to the operator, and an optional summary of aggregate counts. Those messages do not include the worksheet.

3.5 Does the service sell or share member data for advertising?
Answer: [Draft design] There is no member file to sell or share. No advertising profile is built.

3.6 Payments data
Answer: [Draft design] Online checkout is not built. This website does not collect a card number. "Over $5B? Email us." is a mailto link and is not stored by the site.

## 4. Integration

4.1 Core, online banking, or loan origination connection
Answer: [Draft design] None. The credit union links to the branded page. Members who want to apply leave to the credit union's own URLs.

4.2 Single sign-on or core credentials
Answer: [Draft design] Not used.

## 5. Subprocessors

5.1 Hosting
Answer: [Draft design] Vercel hosts the application. What appears in Vercel edge or platform logs, and how long it is kept, is [To be completed].

5.2 AI vendor
Answer: [Draft design] Anthropic is the processor for worksheet reading. Every upload sends the full worksheet image, which may include a name or VIN, to Anthropic. Sign or Walk does not store that file. The grade route does not call Anthropic. This pilot does not use zero data retention. How long Anthropic keeps the request, and in which region, follows Anthropic's current terms. Those terms are [To be completed] by the owner. This draft does not restate them.

5.3 Email delivery
Answer: [Draft design] Resend, when configured, sends the trial confirmation to the staff email, a signup notice to the operator address, and an optional summary of aggregate counts. Resend does not receive the worksheet. Member results are not emailed.

5.4 Payments
Answer: [Draft design] Stripe Checkout is not implemented. No Stripe secret is required to build or run this marketing page.

## 6. Access, change, and logging

6.1 Who can access production
Answer: [To be completed]

6.2 How changes ship
Answer: [Draft design] The original plan was a subdomain only, with credit unions changed by pull request. This preview departs from that plan in two ways. The embed feature lets a credit union frame the check on an allowlisted website. The owner console makes the store the source of truth for credit unions: demo records still begin as config seeds, copied once into an empty store, and the console can add, edit, pause, and remove them. It stores the profile, branding, settings, and aggregate counts. It does not store member worksheets or quote numbers. Both the embed feature and the owner console need owner approval before merge.

6.3 Application logs
Answer: [Draft design] The intended log line is operational: time, tenant, route, grade, flag identifiers, and latency. It is not intended to include the quote, a vehicle, an IP address, or a user agent. Confirming infrastructure logs is [To be completed].

6.4 Retention of any incidental technical data
Answer: [To be completed]

## 7. Security operations

7.1 Encryption in transit
Answer: [Draft design] HTTPS, with TLS terminated by the host. Certificate details are [To be completed].

7.2 Encryption at rest
Answer: [Draft design] The service is designed not to store member quotes. Any incidental platform storage is [To be completed].

7.3 Vulnerability management
Answer: [To be completed]

7.4 Incident response
Answer: [To be completed] Including how a credit union would be notified, and on what timeline.

7.5 Business continuity
Answer: [To be completed]

## 8. AI and member-facing language

8.1 Does a model write the sentences a member reads?
Answer: [Draft design] No. Member-facing sentences come from template pack tp-1.0.0. The analyze route is rules only. Extract sends a worksheet to Anthropic so the numbers can be read, then the same rules produce the grade. See the AI vendor terms draft.

8.2 Fair-lending inputs
Answer: [Draft design] The service does not ask for race, sex, age, ZIP code, or other demographic fields. It does not estimate a credit tier.

## 9. Accessibility

9.1 Target
Answer: [Draft design] WCAG 2.1 level AA. A VPAT or ACR is not part of this draft. See the accessibility statement.

## 10. Attestation

No one has signed this questionnaire. It is draft ${DOCUMENT_VERSION_LABEL}.

## 11. Owner must supply

These titles have no answer in this draft. A blank is not a no.

${OWNER_OPEN_ITEMS.map((item, index) => `${index + 1}. ${item}`).join('\n')}
`.replaceAll('&amp;', '&'),
);

const aiVendorTerms = draftMarkdown(
  'AI vendor terms',
  `
This is Sign or Walk's draft description of the AI terms the credit-union service is being designed around. It is not Anthropic's contract, not a data-processing agreement with that vendor, and not a representation that every item below is already in force.

## 1. Vendor

Anthropic is called on extract when a worksheet image or PDF is uploaded and the API key is set. The analyze route does not call Anthropic. It grades with the rules engine and template pack tp-1.0.0.
This pilot does not use zero data retention. The model snapshot, region, and retention window are [To be completed] from Anthropic's current terms. This draft does not restate them.
The Harborlight page linked from the marketing demo hides upload. The Harborlight member page can still upload, with a cap of 2 extracts an hour.

## 2. What the model is allowed to do

[Draft design] On extract, the file is sent so the numbers can be read. The grade and the sentences a member reads come from the rules engine and template pack tp-1.0.0. A model does not write those sentences. Numbers in those sentences are filled by this application's calculations.

## 3. What the model receives

[Draft design] The full worksheet image or PDF. A worksheet may include a member name and VIN. The typed check does not send a name, email, phone, address, or account number. This application does not store the file.

## 4. Training and retention

[Draft design] This pilot does not use zero data retention. Retention and region follow Anthropic's current terms. Sign or Walk does not train its own model on worksheets. Whether Anthropic trains on a request is in those terms. The owner must attach the terms. This draft does not claim a training prohibition.

## 5. Guard rails

[Draft design] The model's grade must stay within one step of the rules-only grade. Flags must be a subset of conditions the rules engine actually saw. Low confidence, a schema failure, or a timeout falls back to the rules-only result, so the member still gets an answer. The fallback does not invent savings.

## 6. Member-facing claim

The grade compares a quote with labeled benchmark ranges. It is not the credit union's rate, not an offer of credit, and not a guarantee of savings.

## 7. Still open

- Attach Anthropic's current commercial terms and DPA, including the retention window and region.
- Name the exact model snapshot.
- The grade already runs on rules. Extract calls Anthropic only when a worksheet is uploaded and the key is set.

Nothing in this file is Anthropic's contract.
`,
);

const accessibilityStatement = draftMarkdown(
  'Accessibility statement',
  `
Sign or Walk wants the credit-union marketing pages, and the member experience they describe, to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA. This document is draft ${DOCUMENT_VERSION_LABEL}. It is not a VPAT, not an Accessibility Conformance Report, and not a third-party certification.

## Scope of this draft

In scope for the work that produced this draft:

- The page at https://signorwalk.com/credit-unions
- The page at https://signorwalk.com/credit-unions/get-started
- The ungated due-diligence downloads linked from the marketing page

Out of scope for this draft, and not claimed here:

- The consumer grader at /analyze and related consumer flows
- Consumer pages other than the credit-union marketing page and /cu/{slug}
- A published VPAT or ACR
- Assistive-technology testing notes from a formal audit [To be completed]

## What this marketing page aims for

- Headings in order, with one page heading on each page
- Three annual price cards, with the same figures at every width
- Visible labels on the trial form at /credit-unions/get-started (credit union name, contact name, work email, password, optional website). The form does not ask for a card.
- Keyboard access for links and the numbers form at /cu/{slug}
- Contrast intended to meet 4.5:1 for body text and link text on the new pages
- Link text that says where the link goes
- Grades and flags that include words, not color alone
- The due-diligence packet is one zip download, with no email gate
- A mailto link, "Over $5B? Email us.", for institutions that do not have a list price

A statement of aim is not a finding that every criterion passes.

## Known gaps

[To be completed] after an audit of the member experience. Do not treat the absence of a list as a claim that there are no gaps.

## Feedback

Email ${TALK_TO_US_EMAIL} with the page address, what you were trying to do, and the assistive technology if you use one. This draft does not promise a response time. [To be completed: publish a response-time target.]

The marketing contact path is email to ${TALK_TO_US_EMAIL}. The trial form stores the credit union profile, not a member worksheet.

## Enforcement and standards

Target standard: WCAG 2.1 Level AA.
Date of this draft: 2026-10-15.
`,
);

const sampleContract = draftMarkdown(
  'Sample contract',
  `
NOT FOR EXECUTION.
This is a plain-language sample for discussion with counsel. It is missing terms a real agreement needs (liability, indemnity, governing law, and others, each marked below). Do not sign it. Do not treat the prices as an offer that can be accepted by email unless a later, signed order form says so.

Parties
- Provider: Sign or Walk [legal entity name to be completed]
- Customer: [credit union legal name to be completed]
- Effective date: [To be completed]

## 1. Service

Provider will host a branded page at /cu/{slug} on signorwalk.com. A member can enter figures from a dealer quote, see an educational grade and markup flags, and follow a link to the Customer's own pre-approval URL and rates URL.

The page uses the Customer name, mark, and colors supplied by the Customer.

A custom hostname, if any, is [To be completed] and is not self-serve.

## 2. What the service is not

Provider is not a lender and is not the Customer's agent for credit decisions. The service is not an offer of credit. Grades and flags are estimates from numbers the member enters and from benchmark ranges labeled as assumptions. Provider does not guarantee savings, approvals, funded loans, or a change in the Customer's auto-loan volume.

Provider does not endorse a dealer. The Customer does not, by using the service, endorse a dealer.

## 3. Customer materials

The Customer supplies:

- Legal name and the name members should see
- NCUA charter number, where the Customer has one
- Primary color and logo
- Pre-approval URL (https)
- Rates URL (https)
- Requested path slug, used in /cu/{slug}

The Customer is responsible for the accuracy of those URLs and for the rates and disclosures on the Customer's own pages. Provider does not publish the Customer's annual percentage rate and does not add Reg Z trigger terms of its own. [Counsel to confirm this allocation.]

## 4. Prices

List prices, in United States dollars, billed annually. Every priced tier is the same product. The tier follows total assets. There is no monthly price. There is no setup fee.

| Tier | Total assets | Annual |
| --- | --- | --- |
| Starter | Under $250 million | $6,000 |
| Growth | $250 million–$1 billion | $12,000 |
| Pro | $1 billion–$5 billion | $24,000 |

Institutions over $5 billion have no published price. The public page says "Over $5B? Email us." That link is a mailto to ${TALK_TO_US_EMAIL}. This sample does not create a price for them.

The public website's consumer footer says the consumer grader is free. That sentence is about the consumer site. It is not the price of this agreement. Members are not charged to use the branded page.

## 5. Billing

Prices in section 4 are annual. There is no monthly price. There is no setup fee. Online checkout is not built. This sample does not authorize Provider to charge a card. An invoice process for a term after the pilot is [To be completed].

## 6. 90-day free pilot

The Customer may start a 90-day free pilot. There is no charge for 90 days. Whether the Customer can end that pilot early, and on what notice, is [To be completed].

The annual prices in section 4 are the prices after the pilot, if the Customer continues. [Counsel to confirm how a later term is written, including what is charged after the 90 days.]

The pilot is not a promise of funded loans, member savings, or a later term. Conversion from the pilot to a paid term is not automatic in this draft.

## 7. Member data and core systems

The member form does not ask for a name, email, account number, or member number. An uploaded worksheet may include a member name and VIN. That file is sent to Anthropic for the request and is not stored by this application. This pilot does not use zero data retention.

Staff records (credit union name, contact, work email, scrypt login hash) are stored for the trial. They are not a member file.

Provider will not connect to the Customer's core, online banking, or loan origination system.

A data processing addendum (also draft ${DOCUMENT_VERSION_LABEL}) is meant to travel with this sample. It is not signed either.

## 8. Member-facing language

Language a member reads is intended to ship from a template pack the Customer can review. Provider will not claim a guaranteed saving. The Customer may withhold go-live until it accepts a named template-pack version. [Process to be completed.]

## 9. Term and termination

Initial term: [To be completed].
Termination for convenience: [To be completed].
Effect of termination, including removal of the branded page: [To be completed].

## 10. Other clauses this draft deliberately leaves blank

- Confidentiality
- Warranties
- Indemnity
- Limitation of liability
- Insurance covenants
- Governing law and venue
- Assignment
- Publicity

The titles the owner must supply are listed in the security questionnaire, section 11. This sample does not answer them.

## 11. Entire agreement

A future signed order form would control over this sample. This file is draft ${DOCUMENT_VERSION_LABEL} and has no legal effect.
`,
);

const sampleDpa = draftMarkdown(
  'Sample data processing addendum',
  `
NOT FOR EXECUTION.
Draft ${DOCUMENT_VERSION_LABEL}. Not legal advice. Not a signed DPA.

This addendum describes the data this build handles. A worksheet may include a name and VIN, and that file is sent to Anthropic. Counsel for both parties needs to replace the blanks.

## 1. Parties

- Controller / credit union: [To be completed]
- Processor / provider: Sign or Walk [legal entity to be completed]
- Related agreement: the sample contract, which is also an unsigned draft

## 2. Subject

The provider hosts a branded page where a person may enter dealer-quote figures and then leave to the credit union's own pre-approval and rates URLs.

## 3. Data the service is designed not to process

The typed form does not ask for:

- Name, email, phone, postal address
- Social Security number, driver's license number, account number, member number
- Demographics, ZIP code, or a credit-tier label

An uploaded worksheet is different. It may contain a member name and VIN. See section 4. Confirming that numeric fields reject a mistyped identifier is [To be completed].

## 4. Data that may be processed

[Draft design] Dealer-quote figures the person chooses to type (for example price, rate, and term), for long enough to build the on-screen result, and not as a retained member record. Also uploaded worksheet images or PDFs, sent to the AI vendor and not stored by us. Anthropic is the processor for that file. This pilot does not use zero data retention. Retention and region follow Anthropic's current terms and are not restated here.

Staff trial records (credit union name, contact name, work email, scrypt login hash), branding, settings, aggregate grade counts, and audit lines are stored. They are not a member worksheet.

[To be completed] Incidental technical data in host or edge logs (which may include IP address). The application log is intended to exclude quote inputs, IP address, and user agent. Retention of any platform log is not answered in this draft.

## 5. Purpose and instructions

Process the quote figures only to show the educational result and the credit union's links. Sign or Walk does not train a model on them. Do not sell them. Do not use them to market to the person. Whether Anthropic trains on a worksheet request is in Anthropic's terms, which the owner must attach.

## 6. Subprocessors

| Subprocessor | Role | Status in this draft |
| --- | --- | --- |
| Vercel | Application hosting | Intended |
| Anthropic | Reads an uploaded worksheet image or PDF for that request. This pilot does not use zero data retention. | In use on extract when the API key is set |
| Resend | Trial confirmation, signup notice, and an optional count summary. Does not receive the worksheet. | In use when configured |
| Stripe | Card checkout | Not implemented |

A change-notice process for new subprocessors is [To be completed].

## 7. Security

The provider will maintain safeguards appropriate to a service that is not supposed to hold member files. The control descriptions and any independent report are [To be completed]. See the security questionnaire, which has the same open items. Do not treat this addendum as the questionnaire's answers.

## 8. Incidents

The provider will notify the credit union of a confirmed incident involving data under this addendum. The notice timeline is [To be completed]. This draft does not promise a specific number of hours.

## 9. Deletion and return

Because the design does not keep a member record, there should be nothing to return. Any incidental log deletion schedule is [To be completed]. On termination, the branded configuration (name, logo, URLs) is removed from production. The timing is [To be completed].

## 10. International transfers

[To be completed] Host and model regions are not fixed in this draft.

## 11. Audits

The credit union's right to review the due-diligence packet, and any on-site or questionnaire right, is [To be completed]. The downloads on the marketing site are ungated drafts. They are not the audit.

## 12. GLBA

The parties intend the branded page not to create a file of member nonpublic personal information. Whether that intent matches the credit union's own Safeguards program is for the credit union and its counsel. This draft is not that opinion.

## 13. Status

Draft ${DOCUMENT_VERSION_LABEL}. No signature block is offered, because this file must not be signed as-is.
`,
);

export const dueDiligenceDocs: readonly DueDiligenceDoc[] = [
  {
    slug: 'data-flow-diagram',
    title: 'Data-flow diagram',
    description: 'Where a quote goes, and where it does not. No core connection and no stored member record.',
    filename: 'sign-or-walk-data-flow-diagram-draft-v0.9.svg',
    contentType: 'image/svg+xml',
    fileKind: 'SVG',
    body: dataFlowSvg,
  },
  {
    slug: 'security-questionnaire',
    title: 'Security questionnaire',
    description: 'Draft questions for vendor risk. Unanswered items are blanks, not a no.',
    filename: 'sign-or-walk-security-questionnaire-draft-v0.9.md',
    contentType: 'text/markdown',
    fileKind: 'Markdown',
    body: securityQuestionnaire,
  },
  {
    slug: 'ai-vendor-terms',
    title: 'AI vendor terms',
    description: 'Draft of how a model would be limited. Not the vendor’s contract.',
    filename: 'sign-or-walk-ai-vendor-terms-draft-v0.9.md',
    contentType: 'text/markdown',
    fileKind: 'Markdown',
    body: aiVendorTerms,
  },
  {
    slug: 'accessibility-statement',
    title: 'Accessibility statement',
    description: 'Draft WCAG 2.1 statement, scope, and an email contact path.',
    filename: 'sign-or-walk-accessibility-statement-draft-v0.9.md',
    contentType: 'text/markdown',
    fileKind: 'Markdown',
    body: accessibilityStatement,
  },
  {
    slug: 'sample-contract',
    title: 'Sample contract',
    description: 'Draft agreement, including list prices and the 90-day pilot. Not for signature.',
    filename: 'sign-or-walk-sample-contract-draft-v0.9.md',
    contentType: 'text/markdown',
    fileKind: 'Markdown',
    body: sampleContract,
  },
  {
    slug: 'sample-dpa',
    title: 'Sample DPA',
    description: 'Draft data processing addendum. Not for signature.',
    filename: 'sign-or-walk-sample-dpa-draft-v0.9.md',
    contentType: 'text/markdown',
    fileKind: 'Markdown',
    body: sampleDpa,
  },
];

export function getDueDiligenceDoc(slug: string): DueDiligenceDoc | undefined {
  return dueDiligenceDocs.find(doc => doc.slug === slug);
}

export function documentBytes(doc: DueDiligenceDoc): number {
  return new TextEncoder().encode(doc.body).length;
}

for (const doc of dueDiligenceDocs) {
  if (!doc.body.toLowerCase().includes('draft v0.9')) {
    throw new Error(`${doc.slug} is missing the draft v0.9 mark.`);
  }
}
