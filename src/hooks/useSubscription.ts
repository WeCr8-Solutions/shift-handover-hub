import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'single' | 'team' | 'enterprise' | null;

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
    price: 8.99,
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
    price: 24.99,
    priceId: 'price_1SthDFCyekafHX78ukVYmJLp',
    productId: 'prod_TrQ3SzBnvfW4yA',
    users: 4,
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
    price: 49.99,
    priceId: 'price_1SthDUCyekafHX78MIJEHfCG',
    productId: 'prod_TrQ3Y4BKSsc591',
    users: 10,
    additionalUserPrice: 7.99,
    features: [
      'Everything in Team',
      '10+ users included',
      '$7.99/additional user',
      'Admin control panel',
      'Custom integrations',
      'Dedicated account manager',
      'SSO & advanced security',
      'API access',
      'ERP Connector integration',
    ],
  },
} as const;

export function useSubscription() {
  const { user } = useAuth();
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

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

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
  }, [user]);

  const createCheckout = useCallback(async (priceId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to subscribe');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  }, [user]);

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
  };
}
