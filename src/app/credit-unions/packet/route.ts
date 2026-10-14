import { NextResponse } from 'next/server';
import { dueDiligenceDocs } from '@/cu/packet/documents';
import { buildZip } from '@/cu/packet/zip';

const FILENAME = 'sign-or-walk-cu-due-diligence-draft-v0.9.zip';

const README = `Sign or Walk credit-union due diligence packet
Draft v0.9 — 2026-10-14

These files are placeholders for counsel and vendor risk.
They are not a signed contract, not an audit, and not a certification.
The download is ungated. This site does not ask for an email to send it.

The member experience lives at /cu/{slug} on signorwalk.com.
Grading is a rules engine and an approved template pack. Quote numbers are not stored.
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
