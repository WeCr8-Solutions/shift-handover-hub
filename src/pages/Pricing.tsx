import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, PRICING_TIERS, SubscriptionTier } from '@/hooks/useSubscription';
import { 
  Check, 
  Zap, 
  Users, 
  Building2, 
  Loader2,
  Crown,
  Settings,
} from 'lucide-react';
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { FreeTalentProfileBanner } from "@/components/marketing/FreeTalentProfileBanner";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConversionEvents } from '@/lib/analytics';

const tierIcons: Record<string, React.ReactNode> = {
  single: <Zap className="w-6 h-6" />,
  team: <Users className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, tier: currentTier, isLoading, createCheckout, openCustomerPortal } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    ConversionEvents.pricingView(window.location.pathname);
  }, []);

  const handleSubscribe = async (tierKey: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const tier = PRICING_TIERS[tierKey as keyof typeof PRICING_TIERS];
    setLoadingTier(tierKey);

    try {
      await createCheckout(tier.priceId);
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
            {
              "@type": "Question",
              name: "Can I change plans anytime?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes — you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your billing cycle.",
              },
            },
            {
              "@type": "Question",
              name: "What happens if I exceed my user limit?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We'll notify you and suggest upgrading to a plan that fits your team size. Enterprise plans include 10 seats and can add more at $12/month per seat.",
              },
            },
            {
              "@type": "Question",
              name: "Is there a free trial?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes — all plans come with a 14-day free trial to start.",
              },
            },
            {
              "@type": "Question",
              name: "Are talent profiles really free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes — operator talent profiles are always free, with no trial or subscription required. Build a verified shop-floor profile, earn OAP/GCA badges, and get discovered by hiring shops at no cost.",
              },
            },
          ],
        }}
      />
      <MarketingNav />

      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/30 bg-primary/5">
            <Zap className="w-3.5 h-3.5 mr-2 text-primary" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial 
            Cancel anytime.
          </p>
        </div>
        <FreeTalentProfileBanner className="max-w-5xl mx-auto" />
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {Object.entries(PRICING_TIERS).map(([key, tier]) => {
              const isCurrentPlan = currentTier === key;
              const isPopular = key === 'team';

              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex flex-col p-6 lg:p-8 rounded-2xl border transition-all duration-300",
                    isCurrentPlan 
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                      : isPopular 
                        ? "border-primary/50 bg-card shadow-xl scale-105" 
                        : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                       <Badge className="bg-status-ok text-primary-foreground px-4 py-1 gap-1">
                        <Crown className="w-3 h-3" />
                        Your Plan
                      </Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      isCurrentPlan ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    )}>
                      {tierIcons[key]}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {key === 'single' && '1 user'}
                      {key === 'team' && 'Up to 10 users'}
                      {key === 'enterprise' && 'Includes 10 seats, $12/seat/mo after'}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-status-ok flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                    >
                      {loadingPortal ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Manage Plan
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        isPopular && "bg-primary hover:bg-primary/90"
                      )}
                      onClick={() => handleSubscribe(key)}
                      disabled={loadingTier === key || isLoading}
                    >
                      {loadingTier === key ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {subscribed ? 'Switch Plan' : 'Get Started'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ / Notes */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">Can I change plans anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                  Changes take effect at the end of your billing cycle.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">What happens if I exceed my user limit?</h4>
                <p className="text-sm text-muted-foreground">
                  We'll notify you and suggest upgrading to a plan that fits your team size.
                  Enterprise plans include 10 seats and can add more at $12/month per seat.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans come with a 14-day free trial to start.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-1">Are talent profiles really free?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes — operator talent profiles are <strong>always free</strong>, with no
                  trial or subscription required. Build a verified shop-floor profile,
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
