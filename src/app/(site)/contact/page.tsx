import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Sign or Walk',
  description: 'Get in touch with the Sign or Walk team.',
  alternates: { canonical: 'https://signorwalk.com/contact' },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">Contact us</h1>
      <p className="text-gray-500 mb-10">Questions, feedback, or issues with your order — we read every email.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
        <a
          href="mailto:team@signorwalk.com"
          className="text-blue-500 hover:text-blue-600 font-medium text-base transition"
        >
          team@signorwalk.com
        </a>
        <p className="text-xs text-gray-400 mt-2">We typically respond within one business day.</p>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <p className="text-sm font-semibold text-gray-700 mb-1">Deal Support orders</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          After purchase, Stripe will send a receipt to the email you used at checkout. If you haven&apos;t received your negotiation strategy within 24 hours, email us at{' '}
          <a href="mailto:team@signorwalk.com" className="text-blue-500 hover:text-blue-600 transition">
            team@signorwalk.com
          </a>{' '}
          with your order confirmation and we&apos;ll take care of it.
        </p>
      </div>
    </div>
  );
}
