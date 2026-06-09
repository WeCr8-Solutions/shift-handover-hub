import { Check, Crown, Loader2 } from "lucide-react";
import type { PlanTier } from "@/lib/subscriptionTiers";
import { Button } from "@/components/ui/button";

interface Props {
  tier: PlanTier;
  highlighted?: boolean;
  recommended?: boolean;
  /** Force the current-plan badge (overrides popular/recommended). */
  isCurrent?: boolean;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  secondaryCtaLabel?: string;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

/**
 * Shared subscription-tier card used by the marketing /pricing page and the
 * Concierge Sales Pack (screen + print). Renders only from the canonical
 * markdown via the `PlanTier` shape so the two surfaces can't drift.
 */
export function TierCard({
  tier,
  highlighted,
  recommended,
  isCurrent,
  ctaLabel,
  onCtaClick,
  ctaDisabled,
  ctaLoading,
  secondaryCtaLabel,
  onSecondaryCtaClick,
  className,
}: Props) {
  const popular = tier.popular || highlighted;
  return (
    <div
      className={`relative flex flex-col border rounded-xl p-5 bg-card text-card-foreground print:bg-white print:text-black print:border-black/40 ${
        isCurrent
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : popular
            ? "border-primary shadow-md print:border-black"
            : "border-border"
      } ${className ?? ""}`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-status-ok text-primary-foreground inline-flex items-center gap-1">
          <Crown className="w-3 h-3" /> Your plan
        </div>
      )}
      {!isCurrent && popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground print:bg-black print:text-white">
          Most popular
        </div>
      )}
      {recommended && !isCurrent && (
        <div className="absolute -top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white print:bg-black print:text-white inline-flex items-center gap-1">
          <Crown className="w-3 h-3" /> Recommended
        </div>
      )}
      <div className="text-lg font-semibold">{tier.name}</div>
      {tier.tagline && <div className="text-xs text-muted-foreground print:text-black/70 mt-0.5">{tier.tagline}</div>}
      <div className="mt-3">
        <span className="text-3xl font-bold">${tier.price}</span>
        <span className="text-xs text-muted-foreground print:text-black/70 ml-1">/ mo</span>
      </div>
      <div className="text-xs mt-1">
        <b>{tier.seats}</b> seat{tier.seats === 1 ? "" : "s"} included
        {tier.additionalSeatPrice ? <> · ${tier.additionalSeatPrice}/seat after</> : null}
      </div>
      <ul className="mt-4 space-y-1.5 text-xs flex-1">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-primary print:text-black mt-0.5 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {(ctaLabel || secondaryCtaLabel) && (
        <div className="mt-5 flex flex-col gap-2 print:hidden">
          {ctaLabel && (
            <Button
              className="w-full"
              variant={isCurrent ? "outline" : "default"}
              onClick={onCtaClick}
              disabled={ctaDisabled || ctaLoading}
            >
              {ctaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {ctaLabel}
            </Button>
          )}
          {secondaryCtaLabel && (
            <Button variant="ghost" className="w-full" onClick={onSecondaryCtaClick}>
              {secondaryCtaLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
