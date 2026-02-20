import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import joblineLogo from '@/assets/jobline-logo.png';

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
        title="Pricing - Manufacturing Software Plans"
        description="Simple, transparent pricing for manufacturing teams. Start with a 14-day free trial. Plans for individual operators, teams, and enterprise machine shops."
        keywords="manufacturing software pricing, shift handoff software cost, machine shop software pricing, production management pricing"
        canonical="/pricing"
      />
      {/* Header */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {subscribed && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    className="gap-2"
                  >
                    {loadingPortal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                    Manage Subscription
                  </Button>
                )}
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

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
            Start with a 14-day free trial. No credit card required. 
            Cancel anytime.
          </p>
        </div>
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
                      <Badge className="bg-green-500 text-white px-4 py-1 gap-1">
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
                      {key === 'team' && '4 users (1 main + 3 team members)'}
                      {key === 'enterprise' && '10+ users, $7.99/additional'}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
                  Enterprise plans can add users at $7.99/month each.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-1">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans come with a 14-day free trial. No credit card required to start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
