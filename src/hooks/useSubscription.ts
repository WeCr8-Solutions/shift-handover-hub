import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/contexts/OrgContext';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'single' | 'team' | 'enterprise' | 'gca_pro' | null;

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

// Pricing tiers configuration
export const PRICING_TIERS = {
  single: {
    name: 'Single User',
    price: 49,
    priceId: 'price_1SthCzCyekafHX78lL2vp30M',
    productId: 'prod_TrQ3QqbNqlmDiS',
    users: 1,
    features: [
      'Full dashboard access',
      'Unlimited handoff submissions',
      'Performance update tracking',
      'Real-time station monitoring',
      'Email notifications',
      'Mobile-friendly interface',
    ],
  },
  team: {
    name: 'Team',
    price: 149,
    priceId: 'price_1SthDFCyekafHX78ukVYmJLp',
    productId: 'prod_TrQ3SzBnvfW4yA',
    users: 10,
    features: [
      'Everything in Single User',
      '1 main user + 3 team members',
      'Team management dashboard',
      'Shared station assignments',
      'Team analytics & reports',
      'Priority email support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 399,
    priceId: 'price_1SthDUCyekafHX78MIJEHfCG',
    productId: 'prod_TrQ3Y4BKSsc591',
    users: 25,
    additionalUserPrice: 12,
    features: [
      'Everything in Team',
      '10+ users included',
      '$12/additional user',
      'Admin control panel',
      'Custom integrations',
      'Dedicated account manager',
      'SSO & advanced security',
      'API access',
      'ERP Connector integration',
    ],
  },
} as const;

// ERP Connector add-on tiers (Enterprise only)
export const ERP_ADDON_TIERS = {
  starter: {
    name: 'ERP Starter',
    price: 100,
    priceId: 'price_1T5X5MCyekafHX78vbrkFIgd',
    productId: 'prod_U3eObrQgIK5XOW',
    syncLimit: 500,
    features: [
      'Up to 500 syncs/month',
      'JobBOSS, Epicor, Plex connectors',
      'Work order & routing sync',
      'Status mapping',
    ],
  },
  pro: {
    name: 'ERP Pro',
    price: 150,
    priceId: 'price_1T5X5VCyekafHX78scWGJuEX',
    productId: 'prod_U3eOU03pp8fNG0',
    syncLimit: 2000,
    features: [
      'Up to 2,000 syncs/month',
      'Everything in Starter',
      'Priority sync intervals',
      'Advanced work center mapping',
    ],
  },
  unlimited: {
    name: 'ERP Unlimited',
    price: 200,
    priceId: 'price_1T5X5WCyekafHX78FLLJtF9I',
    productId: 'prod_U3eOQKkbY8NHrj',
    syncLimit: -1,
    features: [
      'Unlimited syncs/month',
      'Everything in Pro',
      'Real-time sync',
      'Dedicated ERP support',
    ],
  },
} as const;

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
