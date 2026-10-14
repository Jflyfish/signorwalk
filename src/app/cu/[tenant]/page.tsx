import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { resolveBrand } from '@/cu/brand';
import { getCuTenant, toCuPublic } from '@/cu/tenants';
import { BrandLockup } from '../BrandLockup';
import { CheckForm } from './CheckForm';

export default async function CuPage({ params }: { params: Promise<{ tenant: string }> }) {
  const tenant = getCuTenant((await params).tenant);
  if (!tenant) notFound();
  const brand = await resolveBrand(tenant);
  return (
    <>
      <header className="mx-auto flex min-h-16 w-full max-w-[560px] items-center px-4 py-4">
        <BrandLockup
          name={tenant.name}
          shortName={brand.shortName}
          color={brand.brandText}
          mark={tenant.logo}
          logoLight={brand.logoLight}
          logoAspect={brand.logoAspect}
        />
      </header>
      <CheckForm tenant={toCuPublic(tenant)} brand={brand} />
    </>
  );
}
