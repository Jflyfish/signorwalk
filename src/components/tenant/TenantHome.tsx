import Link from 'next/link';
import type { PublicTenant } from '@/tenants/types';
import { CtaLink } from './CtaLink';

export function TenantHome({ tenant }: { tenant: PublicTenant }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <p className="text-sm font-semibold text-brand-accent mb-3">{tenant.brand.name}</p>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-4">Check a vehicle offer</h1>
      <p className="text-lg text-gray-600 leading-relaxed mb-8">
        Enter the numbers from a lease or finance worksheet. This tool compares them with typical benchmarks and explains the comparison in plain language. It does not ask for your name, and it does not store what you enter.
      </p>
      <Link
        href="/analyze"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-primary text-brand-fg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        Check an offer
        <span aria-hidden="true">→</span>
      </Link>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Numbers only', body: 'Price, rate, term, fees, and optional products. No documents and no account.' },
          { title: 'A benchmark grade', body: 'A through F describes how the figures compare with this tool’s benchmarks. It is not a credit decision.' },
          { title: 'Next step is yours', body: 'When you are ready, continue on the credit union’s own pre-approval or rate page.' },
        ].map(item => (
          <li key={item.title} className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 mb-1.5">{item.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <CtaLink href={tenant.cta.preApprovalUrl} tenant={tenant.id} target="preapproval" className="inline-flex justify-center px-5 py-3 rounded-xl bg-brand-primary text-brand-fg text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          {tenant.cta.preApprovalLabel}
        </CtaLink>
        <CtaLink href={tenant.cta.ratesUrl} tenant={tenant.id} target="rates" className="inline-flex justify-center px-5 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          {tenant.cta.ratesLabel}
        </CtaLink>
      </div>
      <p className="mt-8 text-xs text-gray-500 leading-relaxed">
        Educational only. Not an offer of credit. Not financial, legal, or tax advice. Powered by Sign or Walk, an independent provider. {tenant.brand.name} does not endorse any dealer.
      </p>
    </div>
  );
}
