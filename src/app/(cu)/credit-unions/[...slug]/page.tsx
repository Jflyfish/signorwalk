import { redirect } from 'next/navigation';
import { creditUnionAlias } from '../aliases';

export const dynamic = 'force-dynamic';

export default async function CreditUnionsExtraPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const dest = creditUnionAlias(slug);
  if (dest) redirect(dest);
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-16">
      <h1 className="text-[32px] font-extrabold leading-[38px]">Page not found</h1>
    </main>
  );
}
