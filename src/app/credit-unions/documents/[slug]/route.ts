import { NextResponse } from 'next/server';
import { DOCUMENT_VERSION_LABEL } from '../../pricing';
import { dueDiligenceDocs, getDueDiligenceDoc } from '../../documents';

export function generateStaticParams() {
  return dueDiligenceDocs.map(doc => ({ slug: doc.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const doc = getDueDiligenceDoc(slug);

  if (!doc) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex' },
    });
  }

  const body =
    doc.contentType === 'image/svg+xml'
      ? `<?xml version="1.0" encoding="UTF-8"?>\n${doc.body}`
      : doc.body;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': `${doc.contentType}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${doc.filename}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Document-Version': DOCUMENT_VERSION_LABEL,
      'X-Robots-Tag': 'noindex',
    },
  });
}
