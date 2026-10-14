/**
 * PAYMENTS AND TENANT PROVISIONING ARE NOT IMPLEMENTED.
 *
 * /credit-unions/get-started only says checkout is coming soon.
 * Nothing here calls Stripe, reads a secret, stores a form, or writes tenant configuration.
 *
 * The blocks below stay commented so `next build` and `tsc` pass with no environment variables.
 */

export const CHECKOUT_STATUS = 'coming-soon' as const;

/**
 * TODO(intake): credit union name, NCUA charter number, tier, color, logo,
 * pre-approval URL, rates URL, and the /cu/{slug} path. Do not collect member data.
 * Do not POST until checkout exists.
 *
 * TODO(stripe): Checkout session for Starter, Growth, and Pro.
 * No Stripe package and no environment variable in this preview.
 *
 * TODO(webhook): after checkout.session.completed, open a pull request that adds
 * the tenant to src/cu/tenants.ts. Do not write a database.
 */
