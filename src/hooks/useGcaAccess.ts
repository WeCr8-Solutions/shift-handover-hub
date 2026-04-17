import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';

// ── GCA PRICE IDs ─────────────────────────────────────────────────────────────
// TODO: Create "G-Code Academy" product in Stripe dashboard, then paste the
// resulting price IDs below and in public/gcode-academy/index.html GCA_CONFIG.
// Also add the product ID to PRODUCT_TIERS in:
//   supabase/functions/check-subscription/index.ts
//   supabase/functions/stripe-webhook/index.ts
export const GCA_PRICES = {
  monthly: {
    priceId: 'price_1TN4g9CyekafHX788v10vyWz', // $19/month
    price: 19,
    label: '$19 / month',
  },
  annual: {
    priceId: 'price_1TN4jwCyekafHX785ZAg0oue', // $149/year
    price: 149,
    label: '$149 / year',
    savings: 'Save $79',
  },
  productId: 'prod_ULmEqvUEDTTrpp',
} as const;

export type GcaTier = 'free' | 'pro';

export interface GcaAccessState {
  /** Whether the user has Pro access to GCA lessons and tests. */
  hasProAccess: boolean;
  /** The tier string to send to the GCA iframe via postMessage. */
  gcaTier: GcaTier;
  /** True if we know for certain they have no paid access (not still loading). */
  isDefinitelyFree: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * Redirect to Stripe checkout for a standalone GCA subscription.
   * Returns the checkout URL or throws if price IDs are not configured.
   */
  startGcaCheckout: (interval: 'monthly' | 'annual') => Promise<void>;
}

/**
 * Determines whether the current user has GCA Pro access.
 *
 * Access is granted when the user has:
 *  1. An active JobLine platform subscription (single/team/enterprise), OR
 *  2. A standalone GCA subscription (once GCA_PRICES are populated).
 *
 * Free users can still browse free lessons — they just see locked content for
 * Pro lessons. The upgrade CTA inside GCA and on the wrapper page both link
 * to `/pricing` or trigger a GCA-specific checkout once price IDs are set.
 */
export function useGcaAccess(): GcaAccessState {
  const { user, session } = useAuth();
  const { subscribed, tier, isLoading } = useSubscription();

  // Pro access if either:
  //   1. Active platform subscription (single/team/enterprise), OR
  //   2. Standalone GCA subscription (tier === 'gca_pro')
  const hasProAccess = subscribed || tier === 'gca_pro';
  const gcaTier: GcaTier = hasProAccess ? 'pro' : 'free';
  const isDefinitelyFree = !isLoading && !hasProAccess;

  const startGcaCheckout = useCallback(async (interval: 'monthly' | 'annual') => {
    const priceId = GCA_PRICES[interval].priceId;
    if (!priceId) {
      throw new Error(
        'GCA Stripe price IDs are not configured yet. ' +
        'Create the product in Stripe and add the price IDs to GCA_PRICES in useGcaAccess.ts.'
      );
    }
    if (!session?.access_token) {
      throw new Error('User must be signed in to start checkout.');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        // No orgId: GCA is an individual subscription, not org-scoped.
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  }, [session]);

  return {
    hasProAccess,
    gcaTier,
    isDefinitelyFree,
    isLoading,
    isAuthenticated: !!user,
    startGcaCheckout,
  };
}
