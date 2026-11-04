import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Car Deal Glossary — Every Term You Need to Know | Sign or Walk',
  description: 'Plain-English definitions for every car buying, leasing, and financing term. APR, money factor, residual value, doc fee, holdback, and 25+ more.',
  alternates: { canonical: 'https://signorwalk.com/glossary' },
  openGraph: {
    title: 'Car Deal Glossary — Every Term You Need to Know',
    description: 'Plain-English definitions for every car buying, leasing, and financing term.',
    type: 'website',
    url: 'https://signorwalk.com/glossary',
  },
};

const terms = [
  {
    term: 'Acquisition Fee',
    definition: 'A fee charged by the leasing company at the start of a lease, typically $500–$1,000. It covers the cost of setting up the lease. You usually cannot negotiate it away, but you can sometimes roll it into your cap cost.',
  },
  {
    term: 'APR (Annual Percentage Rate)',
    definition: 'The yearly cost of borrowing money, expressed as a percentage. It includes the interest rate plus any lender fees. Lower is better. On a car loan, your APR is heavily influenced by your credit score.',
    link: { href: '/blog/credit-score-for-best-car-loan-rate', label: 'What credit score gets you the best APR?' },
  },
  {
    term: 'Cap Cost (Capitalized Cost)',
    definition: 'The "price" of a car in a lease — similar to the sale price in a purchase. Negotiating a lower cap cost directly lowers your monthly lease payment. Always negotiate the cap cost before discussing monthly payments.',
  },
  {
    term: 'Cap Cost Reduction',
    definition: 'Any upfront payment that lowers the cap cost on a lease — like a down payment, trade-in credit, or rebate. It reduces your monthly payment but does not affect the money factor or residual value.',
  },
  {
    term: 'CPO (Certified Pre-Owned)',
    definition: 'A used car that has passed a manufacturer inspection and comes with an extended warranty. CPO cars cost more than regular used cars but less than new. They offer more peace of mind than a standard used car.',
    link: { href: '/blog/cpo-vs-used-car-better-deal', label: 'CPO vs used car: which is the better deal?' },
  },
  {
    term: 'Dealer Holdback',
    definition: 'A percentage of MSRP (typically 1–3%) that the manufacturer pays back to the dealer after a car is sold. It means a dealer can sell at invoice price and still make money. Knowing this gives you leverage to negotiate below invoice.',
    link: { href: '/blog/what-is-dealer-holdback-car-negotiation', label: 'How dealer holdback affects your negotiation' },
  },
  {
    term: 'Destination Charge',
    definition: 'A fixed fee the manufacturer charges to ship the car from the factory to the dealership. It appears on the window sticker and is non-negotiable — every buyer pays the same amount for a given model.',
  },
  {
    term: 'Disposition Fee',
    definition: 'A fee charged at the end of a lease if you return the car and do not buy it or lease another from the same brand. Typically $300–$500. Some manufacturers waive it if you lease again with them.',
  },
  {
    term: 'Doc Fee (Documentation Fee)',
    definition: 'A dealer fee for processing paperwork. Ranges from $100 to $800+ depending on the state. Some states cap it; others do not. It is often non-negotiable, but you can ask for it to be reduced or offset elsewhere in the deal.',
    link: { href: '/blog/dealer-fees-you-can-negotiate', label: 'Which dealer fees can you actually negotiate?' },
  },
  {
    term: 'Down Payment',
    definition: 'Cash paid upfront to reduce your loan balance or lease cap cost. On a purchase, a larger down payment means lower monthly payments and less interest paid overall. On a lease, a down payment is often optional and may not be the best use of your money.',
    link: { href: '/blog/good-down-payment-for-a-car-how-much-to-put-down', label: 'How much should you put down on a car?' },
  },
  {
    term: 'F&I (Finance and Insurance)',
    definition: 'The department at a dealership where you sign final paperwork and get pitched add-on products like extended warranties, GAP insurance, and paint protection. F&I is where dealers make a significant portion of their profit.',
    link: { href: '/blog/dealer-add-ons-to-decline-finance-office', label: 'Which F&I add-ons should you decline?' },
  },
  {
    term: 'GAP Insurance',
    definition: 'Covers the difference between what you owe on your loan and what your car is worth if it is totaled or stolen. Useful if you put little money down or have a long loan term. Dealers charge 3–5x what banks charge for the same coverage.',
    link: { href: '/blog/gap-insurance-do-you-need-it-and-cost', label: 'Do you really need GAP insurance?' },
  },
  {
    term: 'Invoice Price',
    definition: 'The price the dealer paid the manufacturer for the car. It is lower than MSRP and is often used as a negotiation anchor. However, dealers can still profit at invoice price due to holdback and incentives.',
    link: { href: '/blog/what-is-invoice-price-buy-car-below-invoice', label: 'Can you buy a car below invoice?' },
  },
  {
    term: 'Lease Takeover',
    definition: 'Taking over someone else\'s active lease. You assume their remaining payments and return obligations. It can be a great way to get into a short lease with no down payment, but you inherit their mileage situation.',
  },
  {
    term: 'Loan Term',
    definition: 'The length of your car loan, usually expressed in months (36, 48, 60, 72, or 84). Longer terms mean lower monthly payments but more interest paid overall. A 72-month loan on a used car is often a red flag.',
    link: { href: '/blog/36-vs-48-vs-60-vs-72-month-car-loan-which-saves-most', label: '36 vs 72 months: which term saves you more?' },
  },
  {
    term: 'Market Adjustment',
    definition: 'An extra markup added to MSRP by a dealer, usually on high-demand or low-supply vehicles. It is entirely at the dealer\'s discretion. You can negotiate it or shop at dealers who do not charge one.',
  },
  {
    term: 'Mileage Allowance',
    definition: 'The maximum miles per year included in a lease, typically 10,000–15,000. Driving over this limit triggers per-mile overage fees at lease end, usually $0.15–$0.30 per mile. Always estimate your annual mileage honestly before signing.',
  },
  {
    term: 'Money Factor',
    definition: 'The interest rate on a car lease, expressed as a tiny decimal (e.g., 0.00125). Multiply it by 2,400 to convert it to an approximate APR. A lower money factor means a cheaper lease.',
    link: { href: '/blog/money-factor-car-lease-convert-to-apr', label: 'How to convert money factor to APR' },
  },
  {
    term: 'Monroney Label',
    definition: 'The official window sticker required by federal law on every new car. It shows MSRP, standard features, optional packages, fuel economy, and the destination charge. It is your starting point for any negotiation.',
    link: { href: '/blog/how-to-read-car-window-sticker-monroney-label', label: 'How to read a Monroney label' },
  },
  {
    term: 'MSRP (Manufacturer\'s Suggested Retail Price)',
    definition: 'The sticker price set by the manufacturer. It is the starting point for negotiation on new cars, not the final price. Most buyers should aim to pay below MSRP, though high-demand vehicles sometimes sell above it.',
  },
  {
    term: 'Negative Equity',
    definition: 'When you owe more on your car than it is worth. Also called being "upside down." Common with long loan terms or small down payments. Rolling negative equity into a new loan is one of the most expensive mistakes a car buyer can make.',
    link: { href: '/blog/upside-down-car-loan-what-to-do', label: 'What to do if you\'re upside down on your loan' },
  },
  {
    term: 'Out-the-Door Price',
    definition: 'The total amount you pay for a car including taxes, fees, and all dealer charges. Always ask for the out-the-door price in writing before agreeing to anything. It is the only number that actually matters.',
    link: { href: '/blog/what-is-out-the-door-price-on-a-car', label: 'How to calculate your out-the-door price' },
  },
  {
    term: 'Pre-Approval',
    definition: 'Getting approved for a car loan from a bank or credit union before going to the dealership. It gives you a rate benchmark so the dealer cannot mark up your financing without you knowing. Always get pre-approved first.',
    link: { href: '/blog/how-to-get-pre-approved-for-a-car-loan-before-dealer', label: 'How to get pre-approved for a car loan' },
  },
  {
    term: 'Rebate',
    definition: 'A manufacturer incentive that reduces the price of a car. It can come as cash back or a low APR offer. You usually cannot combine both — pick whichever saves you more money based on your loan amount and term.',
  },
  {
    term: 'Residual Value',
    definition: 'The estimated value of a leased car at the end of the lease term, expressed as a percentage of MSRP. A higher residual value means lower monthly payments. You cannot negotiate the residual — it is set by the leasing company.',
    link: { href: '/blog/what-is-residual-value-car-lease', label: 'Why residual value matters on a lease' },
  },
  {
    term: 'Trade-In Value',
    definition: 'What a dealer offers you for your current car. It is almost always lower than private-party sale value. Get offers from Carmax, Carvana, and KBB Instant Cash Offer before going to the dealer so you have leverage.',
    link: { href: '/blog/how-to-trade-in-your-car-without-getting-ripped-off', label: 'How to trade in your car without getting ripped off' },
  },
  {
    term: 'VSC (Vehicle Service Contract)',
    definition: 'The correct term for what dealers call an "extended warranty." Unlike a factory warranty, a VSC is a contract with a third party. Read the fine print carefully — many claims are denied on technicalities. Buying one from a dealer is almost always overpriced.',
    link: { href: '/blog/extended-warranty-vs-factory-warranty-what-dealers-wont-tell-you', label: 'Extended warranty vs factory warranty explained' },
  },
];

const alphabet = [...new Set(terms.map(t => t.term[0]))].sort();

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Car Deal Glossary',
  description: 'Plain-English definitions for every car buying, leasing, and financing term.',
  url: 'https://signorwalk.com/glossary',
  hasDefinedTerm: terms.map(t => ({
    '@type': 'DefinedTerm',
    name: t.term,
    description: t.definition,
    inDefinedTermSet: 'https://signorwalk.com/glossary',
  })),
};

export default function GlossaryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Reference</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Car Deal Glossary</h1>
        <p className="text-gray-500 text-base">Every term you will encounter when buying, leasing, or financing a car — explained in plain English.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {alphabet.map(letter => (
          <a
            key={letter}
            href={`#${letter}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
          >
            {letter}
          </a>
        ))}
      </div>

      <div className="space-y-2">
        {alphabet.map(letter => {
          const group = terms.filter(t => t.term[0] === letter);
          return (
            <div key={letter} id={letter}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-6 pb-3 border-b border-gray-100">{letter}</h2>
              <div className="space-y-6 pt-4">
                {group.map(item => (
                  <div key={item.term}>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.term}</h3>
                    <p className="text-base text-gray-600 leading-relaxed">{item.definition}</p>
                    {item.link && (
                      <Link href={item.link.href} className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-2 hover:underline">
                        {item.link.label} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <p className="text-base font-bold text-gray-900 mb-1">See these terms in action</p>
          <p className="text-base text-gray-500 mb-5 leading-relaxed">Upload your deal and our AI will flag every fee, rate, and number that doesn&apos;t add up.</p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all"
          >
            Grade My Deal — Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
