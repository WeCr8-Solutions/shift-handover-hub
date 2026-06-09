import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { TIERS, ADDONS, TIER_META } from '@/lib/subscriptionTiers';
import { TierCard } from '@/components/marketing/TierCard';
import { Zap, Loader2 } from 'lucide-react';
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { FreeTalentProfileBanner } from "@/components/marketing/FreeTalentProfileBanner";
import { ConciergeCTA } from "@/components/marketing/ConciergeCTA";
import { toast } from 'sonner';
import { ConversionEvents } from '@/lib/analytics';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, tier: currentTier, isLoading, createCheckout, openCustomerPortal } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    ConversionEvents.pricingView(window.location.pathname);
  }, []);

  const handleSubscribe = async (slug: string, priceId?: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!priceId) {
      toast.error('This plan is not configured for checkout yet. Please contact sales.');
      return;
    }
    setLoadingTier(slug);
    try {
      await createCheckout(priceId);
      toast.success('Redirecting to checkout...');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing — Manufacturing Software Plans"
        description="Transparent pricing for CNC shops. 14-day free trial. Plans for individual operators, teams, and enterprise machine shops."
        keywords="manufacturing software pricing, shift handoff software cost, machine shop software pricing, production management pricing"
        canonical="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Can I change plans anytime?", acceptedAnswer: { "@type": "Answer", text: "Yes — you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your billing cycle." } },
            { "@type": "Question", name: "What happens if I exceed my user limit?", acceptedAnswer: { "@type": "Answer", text: "We'll notify you and suggest upgrading to a plan that fits your team size." } },
            { "@type": "Question", name: "Is there a free trial?", acceptedAnswer: { "@type": "Answer", text: `Yes — all plans come with a ${TIER_META.trial_days}-day free trial to start.` } },
            { "@type": "Question", name: "Are talent profiles really free?", acceptedAnswer: { "@type": "Answer", text: "Yes — operator talent profiles are always free, with no trial or subscription required." } },
          ],
        }}
      />
      <MarketingNav />

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/30 bg-primary/5">
            <Zap className="w-3.5 h-3.5 mr-2 text-primary" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a {TIER_META.trial_days}-day free trial. Cancel anytime.
          </p>
        </div>
        <FreeTalentProfileBanner className="max-w-5xl mx-auto" />
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {TIERS.map((tier) => {
              const isCurrent = currentTier === tier.slug;
              return (
                <TierCard
                  key={tier.slug}
                  tier={tier}
                  isCurrent={isCurrent}
                  ctaLabel={
                    isCurrent ? 'Manage Plan' : subscribed ? 'Switch Plan' : 'Get Started'
                  }
                  ctaLoading={isCurrent ? loadingPortal : loadingTier === tier.slug}
                  ctaDisabled={isLoading}
                  onCtaClick={() =>
                    isCurrent ? handleManageSubscription() : handleSubscribe(tier.slug, tier.priceId)
                  }
                />
              );
            })}
          </div>

          {ADDONS.length > 0 && (
            <div className="mt-16 max-w-5xl mx-auto">
              <h2 className="text-xl font-semibold mb-4 text-center">ERP Connector add-ons</h2>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
                Optional read-through bridges to JobBOSS and SAP S/4HANA. Add on top of any plan; ITAR
                orgs default to read-only sync.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {ADDONS.map((addon) => (
                  <div key={addon.slug} className="border rounded-xl p-5 bg-card">
                    <div className="text-base font-semibold">{addon.name}</div>
                    {addon.tagline && (
                      <div className="text-xs text-muted-foreground mt-0.5">{addon.tagline}</div>
                    )}
                    <div className="mt-3">
                      <span className="text-2xl font-bold">${addon.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ mo</span>
                    </div>
                    {addon.syncLimit !== null && (
                      <div className="text-xs mt-1">Up to {addon.syncLimit.toLocaleString()} records / mo</div>
                    )}
                    <ul className="mt-3 space-y-1 text-xs">
                      {addon.benefits.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 max-w-4xl mx-auto">
            <ConciergeCTA variant="banner" />
          </div>

          <div className="mt-16 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">Can I change plans anytime?</h4>
                <p className="text-sm text-muted-foreground">Yes — upgrade, downgrade, or cancel anytime. Changes take effect at the end of your billing cycle.</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">All plans include a {TIER_META.trial_days}-day free trial.</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-1">Are talent profiles really free?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes — operator talent profiles are <strong>always free</strong>. Build a verified shop-floor profile,
                  earn OAP/GCA badges, and get discovered by hiring shops at no cost.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-16">
            <AdPlacement format="horizontal" />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

      </section>

      <MarketingFooter />
    </div>
  );
}
