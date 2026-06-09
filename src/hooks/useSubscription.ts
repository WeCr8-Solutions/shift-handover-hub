import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/contexts/OrgContext';
import { supabase } from '@/integrations/supabase/client';
import {
  PRICING_TIERS_LEGACY,
  ERP_ADDON_TIERS_LEGACY,
  TIERS,
  ADDONS,
  TIER_META,
  FAQ,
} from '@/lib/subscriptionTiers';

export type SubscriptionTier = 'single' | 'team' | 'enterprise' | 'gca_pro' | null;

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

// Pricing tiers — sourced from `src/content/subscription-tiers.md` (single
// source of truth). Re-exported with the legacy shape so existing imports
// (`PRICING_TIERS.team.priceId`, `.features`, …) keep working unchanged.
export const PRICING_TIERS = PRICING_TIERS_LEGACY;
export { TIERS, ADDONS, TIER_META, FAQ };
// ERP Connector add-on tiers — also sourced from markdown.
export const ERP_ADDON_TIERS = ERP_ADDON_TIERS_LEGACY;


export function useSubscription() {
  const { user, session } = useAuth();
  // F-6: include org ID so subscription re-fetches on org switch
  const { organization } = useOrgContext();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: null,
    subscriptionEnd: null,
    isLoading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({
        subscribed: false,
        tier: null,
        subscriptionEnd: null,
        isLoading: false,
        error: null,
      });
      return;
    }
    // Pass org_id so the edge function can scope subscription to the active org
    const orgId = organization?.id;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: orgId ? { org_id: orgId } : undefined,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw error;

      setState({
        subscribed: data.subscribed,
        tier: data.tier as SubscriptionTier,
        subscriptionEnd: data.subscription_end,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, [session?.access_token, user, organization?.id]);

  const createCheckout = useCallback(async (priceId: string, quantity?: number) => {
    if (!user) {
      throw new Error('User must be authenticated to subscribe');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, quantity },
    });

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  }, [user]);

  const updateSeats = useCallback(async (quantity: number) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase.functions.invoke('update-seats', {
      body: { quantity },
    });

    if (error) throw error;

    // Refresh subscription state
    await checkSubscription();

    return data;
  }, [user, checkSubscription]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  }, [user]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    updateSeats,
  };
}
