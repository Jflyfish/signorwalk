import { NextResponse } from 'next/server';
import { dueDiligenceDocs } from '@/cu/packet/documents';
import { buildZip } from '@/cu/packet/zip';
import { DOCUMENT_VERSION_LABEL } from '../../pricing';

const FILENAME = `sign-or-walk-cu-due-diligence-${DOCUMENT_VERSION_LABEL.replace(/ /g, '-')}.zip`;

const README = `Sign or Walk credit-union due diligence packet
${DOCUMENT_VERSION_LABEL.replace(/^draft/, 'Draft')} — 2026-10-15

PILOT-ONLY, PENDING COUNSEL REVIEW.
These files describe what this build does. They are not a signed contract, not an audit, and not a certification.
The download is ungated. This site does not ask for an email to send it.

A worksheet image or PDF is sent to Anthropic for that request. This pilot does not use zero data retention. Retention window and region — [To be completed — owner]. This application does not store the worksheet.
Grading is a rules engine and template pack tp-1.0.0. Quote numbers are not stored as a member file.
`;

function packetBytes(): Uint8Array {
  const files = [
    { name: 'README.txt', data: Buffer.from(README) },
    ...dueDiligenceDocs.map(doc => ({
      name: doc.filename,
      data: Buffer.from(
        doc.contentType === 'image/svg+xml' && !doc.body.startsWith('<?xml')
          ? `<?xml version="1.0" encoding="UTF-8"?>\n${doc.body}`
          : doc.body,
      ),
    })),
  ];
  return new Uint8Array(buildZip(files));
}

const bytes = packetBytes();
const body = new ArrayBuffer(bytes.byteLength);
new Uint8Array(body).set(bytes);

export function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${FILENAME}"`,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}
