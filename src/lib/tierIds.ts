/**
 * Stripe priceId / productId overlay for the canonical tier list defined in
 * `src/content/subscription-tiers.md`. Customer-facing copy lives in the
 * Markdown; environment-specific Stripe identifiers stay here so secrets
 * never leak into editable docs.
 */
export const TIER_STRIPE_IDS = {
  single: {
    priceId: "price_1Ta3rBCyekafHX78oWOWAMZ9",
    productId: "prod_TrQ3QqbNqlmDiS",
  },
  team: {
    priceId: "price_1Ta3rpCyekafHX78bTWZCgFH",
    productId: "prod_TrQ3SzBnvfW4yA",
  },
  enterprise: {
    priceId: "price_1Ta3sYCyekafHX78598rf2kc",
    productId: "prod_TrQ3Y4BKSsc591",
  },
} as const;

export const ERP_ADDON_STRIPE_IDS = {
  erp_starter: {
    priceId: "price_1T5X5MCyekafHX78vbrkFIgd",
    productId: "prod_U3eObrQgIK5XOW",
  },
  erp_pro: {
    priceId: "price_1T5X5VCyekafHX78scWGJuEX",
    productId: "prod_U3eOU03pp8fNG0",
  },
  erp_unlimited: {
    priceId: "price_1T5X5WCyekafHX78FLLJtF9I",
    productId: "prod_U3eOQKkbY8NHrj",
  },
} as const;
