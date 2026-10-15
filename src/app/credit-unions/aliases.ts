/** Old or guessed marketing URLs that should open a real page instead of a soft 404. */

export function creditUnionAlias(slug: string[]): string | null {
  const path = slug.join('/').toLowerCase().replace(/\/+$/, '');
  if (!path || path.includes('..')) return null;
  if (
    path === 'terms'
    || path.startsWith('terms.')
    || path.endsWith('/terms')
    || path.includes('terms-of-service')
    || path.includes('terms-of-use')
  ) return '/credit-unions/terms';
  if (path.includes('privacy')) return '/credit-unions/privacy';
  if (
    path.includes('packet')
    || path.includes('due-diligence')
    || path.includes('due_diligence')
    || path.endsWith('.pdf')
  ) return '/credit-unions/packet';
  return null;
}
