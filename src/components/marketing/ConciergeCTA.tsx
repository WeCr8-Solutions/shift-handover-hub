import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INCLUDES = [
  "Equipment & stations configured",
  "Users, roles & permissions set up",
  "Routing templates & quality checkpoints",
  "ERP / JobBOSS / SAP connector (if needed)",
  "OAP training programs assigned",
  "Production-ready on day one",
];

interface ConciergeCTAProps {
  variant?: "banner" | "card" | "compact";
  className?: string;
  showPrice?: boolean;
}

export function ConciergeCTA({
  variant = "card",
  className,
  showPrice = true,
}: ConciergeCTAProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function buy() {
    if (!user) {
      navigate("/auth?redirect=/onboarding-service");
      return;
    }
    if (!organizationId) {
      toast.error("Create or join an organization first.");
      navigate("/setup");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-concierge-checkout", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "banner") {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-8 md:px-10 md:py-10",
          className
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                White-glove setup
              </span>
            </div>
            <h3 className="text-2xl font-bold">Skip the setup. Start production on day one.</h3>
            <p className="text-sm text-muted-foreground">
              Our team configures your shop end-to-end — equipment, users, routing, quality checkpoints,
              and ERP integration — so your operators log in to a ready facility.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {showPrice && (
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold">$1,500</div>
                <div className="text-xs text-muted-foreground">one-time fee</div>
              </div>
            )}
            <Button size="lg" onClick={buy} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get Concierge Setup <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3", className)}>
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">White-glove concierge setup available</p>
          <p className="text-xs text-muted-foreground truncate">
            We configure your shop so you skip the trial-and-error.
          </p>
        </div>
        <Button size="sm" onClick={buy} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Learn more"}
        </Button>
      </div>
    );
  }

  // default "card"
  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02]", className)}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary gap-1">
            <Sparkles className="w-3 h-3" /> Concierge
          </Badge>
        </div>
        <h3 className="text-xl font-bold">White-glove onboarding</h3>
        <p className="text-sm text-muted-foreground">
          Have the JobLine.ai team set up your facility end-to-end. Your operators log in to a
          production-ready shop — equipment, routing, quality, and training all configured.
        </p>
        <ul className="space-y-1.5">
          {INCLUDES.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2 flex items-center justify-between">
          {showPrice && (
            <div>
              <span className="text-2xl font-bold">$1,500</span>
              <span className="text-sm text-muted-foreground ml-1">one-time</span>
            </div>
          )}
          <Button onClick={buy} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Purchase <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/*
  Reusable ConciergeButton — thin CTA that just triggers the checkout flow.
  Use anywhere you want a "Get concierge setup" button without the surrounding card/banner.
*/
interface ConciergeButtonProps {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  children?: React.ReactNode;
}

export function ConciergeButton({
  size = "default",
  variant = "default",
  className,
  children = "Get Concierge Setup",
}: ConciergeButtonProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function buy() {
    if (!user) {
      navigate("/auth?redirect=/onboarding-service");
      return;
    }
    if (!organizationId) {
      toast.error("Create or join an organization first.");
      navigate("/setup");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-concierge-checkout", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={buy}
      disabled={loading}
      className={cn("gap-2", className)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {children}
    </Button>
  );
}
