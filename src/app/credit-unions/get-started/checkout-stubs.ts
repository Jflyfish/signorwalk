/**
 * PAYMENTS ARE NOT BUILT.
 * /credit-unions/get-started only says self-serve checkout is coming.
 * Nothing here calls Stripe, reads a secret, stores a form, or writes a tenant.
 *
 * Planned approach, not implemented:
 * - Three Stripe Payment Links, test mode, one per tier, each with a 90-day trial.
 * - Custom fields on those links: charter number, pre-approval URL, subdomain.
 * - A static success page after payment.
 * - Logo collected by email, not in checkout.
 * - Webhook-to-PR later: a completed checkout opens a pull request that adds the tenant.
 *
 * `next build` and `tsc` stay green with no environment variables.
 */

export const CHECKOUT_STATUS = 'coming-soon' as const;
