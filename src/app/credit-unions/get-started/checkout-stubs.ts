/**
 * PAYMENTS AND TENANT PROVISIONING ARE NOT IMPLEMENTED.
 *
 * /credit-unions/get-started only tells the visitor that checkout is coming soon.
 * "Talk to us" is a mailto link defined in ../pricing.ts. This module must not
 * call Stripe, read a secret, open a network request, store a form, or write
 * tenant configuration.
 *
 * The blocks below are stubs for a later change. Leave them commented out so
 * `next build` and `tsc` pass with no environment variables.
 */

export const CHECKOUT_STATUS = 'coming-soon' as const;

/**
 * TODO(intake-form): Collect credit-union configuration only.
 * Do not ask for member names, account numbers, or deal data.
 * Do not POST the form until checkout exists. Do not store submissions.
 *
 * Fields:
 * - cuName: legal name of the credit union
 * - charterNumber: NCUA charter number
 * - tier: 'starter' | 'growth' | 'pro'
 * - color: primary brand color (hex)
 * - logo: SVG or PNG mark
 * - preApprovalUrl: the credit union's own pre-approval page (https)
 * - ratesUrl: the credit union's own auto-rate page (https)
 * - subdomain: label for {subdomain}.signorwalk.app
 */
/*
export function IntakeForm() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // TODO: pass these fields as Checkout metadata.
        // Do not write them to a database.
      }}
    >
      <label>
        Credit union name
        <input name="cuName" autoComplete="organization" required />
      </label>
      <label>
        NCUA charter number
        <input name="charterNumber" inputMode="numeric" required />
      </label>
      <label>
        Tier
        <select name="tier" defaultValue="starter">
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      <label>
        Brand color
        <input name="color" type="text" placeholder="#1d4ed8" required />
      </label>
      <label>
        Logo
        <input name="logo" type="file" accept="image/svg+xml,image/png" required />
      </label>
      <label>
        Pre-approval URL
        <input name="preApprovalUrl" type="url" required />
      </label>
      <label>
        Rates URL
        <input name="ratesUrl" type="url" required />
      </label>
      <label>
        Subdomain
        <input name="subdomain" required />
      </label>
      <button type="submit">Continue to payment</button>
    </form>
  );
}
*/

/**
 * TODO(stripe-checkout): Create a Stripe Checkout Session for Starter, Growth, or Pro.
 * Do not add the Stripe package. Do not require STRIPE_SECRET_KEY at build time.
 * Annual price is the list price (two months free). Monthly is annual / 10.
 * Setup is a separate one-time line. Over $5B, leagues, and CUSOs stay mailto-only.
 */
/*
import Stripe from 'stripe';

export async function createCreditUnionCheckout(input: {
  tier: 'starter' | 'growth' | 'pro';
  billing: 'monthly' | 'annual';
  cuName: string;
  charterNumber: string;
  color: string;
  preApprovalUrl: string;
  ratesUrl: string;
  subdomain: string;
}) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  const priceEnv = `STRIPE_PRICE_${input.tier.toUpperCase()}_${input.billing.toUpperCase()}`;
  const priceId = process.env[priceEnv];
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://signorwalk.com/credit-unions/get-started?status=success',
    cancel_url: 'https://signorwalk.com/credit-unions/get-started?status=cancelled',
    metadata: {
      cuName: input.cuName,
      charterNumber: input.charterNumber,
      tier: input.tier,
      billing: input.billing,
      color: input.color,
      preApprovalUrl: input.preApprovalUrl,
      ratesUrl: input.ratesUrl,
      subdomain: input.subdomain,
    },
  });
  return session.url;
}
*/

/**
 * TODO(webhook-tenant-pr): Stripe webhook that opens a tenant-config pull request.
 * Suggested path, not registered: POST /api/credit-unions/stripe-webhook
 * On checkout.session.completed, verify the Stripe signature, then open a PR that
 * adds a typed tenant (hosts, brand color, logo, pre-approval URL, rates URL,
 * subdomain). A person reviews that PR. The webhook must not edit production itself
 * and must not store member PII. Do not read STRIPE_WEBHOOK_SECRET at build time.
 */
/*
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  const signature = request.headers.get('stripe-signature') ?? '';
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? '',
  );

  if (event.type === 'checkout.session.completed') {
    const metadata = event.data.object.metadata ?? {};
    // TODO: open a GitHub pull request adding this tenant to the tenancy config:
    // { cuName, charterNumber, tier, color, preApprovalUrl, ratesUrl, subdomain } = metadata
    // Do not merge the PR from the webhook.
    void metadata;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
*/
