import { NextRequest } from 'next/server';
import { missingTenantResponse } from '@/cu/missing-page';

async function missing(_req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  return missingTenantResponse(`/api/cu/${slug.join('/')}`);
}

export const GET = missing;
export const POST = missing;
export const PUT = missing;
export const PATCH = missing;
export const DELETE = missing;
