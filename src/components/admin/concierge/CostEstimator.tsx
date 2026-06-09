import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator } from "lucide-react";
import { TIERS, ADDONS, TIER_META } from "@/lib/subscriptionTiers";

export interface CostInputs {
  tierSlug: string;
  seats: number;
  addonSlugs: string[];
  conciergeFee: number;
}

export interface CostBreakdown {
  tierBase: number;
  extraSeats: number;
  extraSeatTotal: number;
  addonMonthly: number;
  monthlyTotal: number;
  annualTotal: number;
  oneTimeConciergeFee: number;
  inputs: CostInputs;
  meta: { currency: string; trial_days: number };
}

export function computeCost(inputs: CostInputs): CostBreakdown {
  const tier = TIERS.find((t) => t.slug === inputs.tierSlug) ?? TIERS[0];
  const seats = Math.max(1, inputs.seats || tier.seats);
  const extraSeats = Math.max(0, seats - tier.seats);
  const extraSeatTotal = extraSeats * (tier.additionalSeatPrice ?? 0);
  const addonMonthly = inputs.addonSlugs.reduce((sum, slug) => {
    const a = ADDONS.find((x) => x.slug === slug);
    return sum + (a?.price ?? 0);
  }, 0);
  const monthlyTotal = tier.price + extraSeatTotal + addonMonthly;
  return {
    tierBase: tier.price,
    extraSeats,
    extraSeatTotal,
    addonMonthly,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    oneTimeConciergeFee: inputs.conciergeFee || 0,
    inputs: { ...inputs, seats },
    meta: { currency: TIER_META.currency, trial_days: TIER_META.trial_days },
  };
}

interface Props {
  value: CostInputs;
  onChange: (v: CostInputs) => void;
  readOnly?: boolean;
}

export function CostEstimator({ value, onChange, readOnly }: Props) {
  const breakdown = useMemo(() => computeCost(value), [value]);
  const tier = TIERS.find((t) => t.slug === value.tierSlug) ?? TIERS[0];

  const set = <K extends keyof CostInputs>(k: K, v: CostInputs[K]) => onChange({ ...value, [k]: v });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Cost arrangement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Tier</Label>
            <Select value={value.tierSlug} onValueChange={(v) => set("tierSlug", v)} disabled={readOnly}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>{t.name} — ${t.price}/mo</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px]">Seats</Label>
            <Input
              type="number"
              min={tier.seats}
              value={value.seats}
              onChange={(e) => set("seats", Number(e.target.value) || tier.seats)}
              disabled={readOnly}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-[11px] mb-1 block">ERP add-ons</Label>
          <div className="grid grid-cols-1 gap-1">
            {ADDONS.map((a) => {
              const checked = value.addonSlugs.includes(a.slug);
              return (
                <label key={a.slug} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={checked}
                    disabled={readOnly}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...value.addonSlugs, a.slug]
                        : value.addonSlugs.filter((s) => s !== a.slug);
                      set("addonSlugs", next);
                    }}
                  />
                  <span>{a.name} — ${a.price}/mo</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-[11px]">One-time concierge fee</Label>
          <Input
            type="number"
            min={0}
            value={value.conciergeFee}
            onChange={(e) => set("conciergeFee", Number(e.target.value) || 0)}
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>

        <div className="border-t pt-2 space-y-0.5">
          <div className="flex justify-between"><span>Tier base</span><span>${breakdown.tierBase}/mo</span></div>
          {breakdown.extraSeats > 0 && (
            <div className="flex justify-between"><span>+{breakdown.extraSeats} extra seat(s)</span><span>${breakdown.extraSeatTotal}/mo</span></div>
          )}
          {breakdown.addonMonthly > 0 && (
            <div className="flex justify-between"><span>ERP add-ons</span><span>${breakdown.addonMonthly}/mo</span></div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Monthly total</span><span>${breakdown.monthlyTotal}/mo</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Annual</span><span>${breakdown.annualTotal.toLocaleString()}/yr</span>
          </div>
          {breakdown.oneTimeConciergeFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>One-time concierge</span><span>${breakdown.oneTimeConciergeFee.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
