import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, GraduationCap, Save } from "lucide-react";
import { useOapMentorPolicy } from "@/hooks/useOapMentorPolicy";

interface Props {
  orgId: string | null;
  /** When false, controls are read-only (e.g., showing to non-admins). */
  canEdit?: boolean;
}

export function OapMentorPolicyCard({ orgId, canEdit = true }: Props) {
  const { policy, isLoading, save } = useOapMentorPolicy(orgId);

  const [autoMentors, setAutoMentors] = useState(true);
  const [delayEnabled, setDelayEnabled] = useState(true);
  const [delayDays, setDelayDays] = useState(30);
  const [allowOverride, setAllowOverride] = useState(false);

  useEffect(() => {
    if (!policy) return;
    setAutoMentors(policy.org_role_auto_mentors);
    setDelayEnabled(policy.delay_day_fallback_enabled);
    setDelayDays(policy.delay_days);
    setAllowOverride(policy.allow_self_certify_on_delay);
  }, [policy]);

  if (!orgId) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground text-center">
          Select an organization to manage OAP mentor policy.
        </CardContent>
      </Card>
    );
  }

  const dirty =
    !!policy &&
    (autoMentors !== policy.org_role_auto_mentors ||
      delayEnabled !== policy.delay_day_fallback_enabled ||
      delayDays !== policy.delay_days ||
      allowOverride !== policy.allow_self_certify_on_delay);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="w-4 h-4" /> OAP Mentor Policy
        </CardTitle>
        <CardDescription>
          Decides who can sign off Operator Acceptance Program completions. All paths are audited; operators can never self-certify.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading policy…
          </div>
        )}

        {/* 1. Role-based auto-mentor */}
        <div className="flex items-start justify-between gap-4 border rounded-md p-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-status-ok" />
              Owners &amp; Supervisors are auto-mentors
            </div>
            <p className="text-xs text-muted-foreground">
              Org admins, owners, and supervisors can sign off any OAP enrollment without separate mentor designation.
            </p>
          </div>
          <Switch checked={autoMentors} onCheckedChange={setAutoMentors} disabled={!canEdit} />
        </div>

        {/* 2. Delay-day fallback */}
        <div className="border rounded-md p-3 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                Delay-day fallback
                <Badge variant="outline" className="text-[10px]">Mentor lock release</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                If the designated mentor doesn't sign off within N days of enrollment start, owners/supervisors can complete it themselves.
              </p>
            </div>
            <Switch checked={delayEnabled} onCheckedChange={setDelayEnabled} disabled={!canEdit} />
          </div>

          <div className={delayEnabled ? "" : "opacity-50 pointer-events-none"}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Delay days before override</Label>
              <span className="text-sm font-semibold tabular-nums">{delayDays} {delayDays === 1 ? "day" : "days"}</span>
            </div>
            <Slider
              value={[delayDays]}
              onValueChange={(v) => setDelayDays(v[0] ?? 30)}
              min={0}
              max={90}
              step={1}
              disabled={!canEdit}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
              <span>0 (immediate)</span><span>30 default</span><span>90 max</span>
            </div>
          </div>

          <div className={`flex items-start justify-between gap-4 pt-2 border-t ${delayEnabled ? "" : "opacity-50 pointer-events-none"}`}>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm font-medium">Allow override after delay</Label>
              <p className="text-xs text-muted-foreground">
                When elapsed, owners/supervisors get a "Complete with override" action on the enrollment. Always audited.
              </p>
            </div>
            <Switch checked={allowOverride} onCheckedChange={setAllowOverride} disabled={!canEdit || !delayEnabled} />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                save.mutate({
                  org_role_auto_mentors: autoMentors,
                  delay_day_fallback_enabled: delayEnabled,
                  delay_days: delayDays,
                  allow_self_certify_on_delay: allowOverride,
                })
              }
              disabled={!dirty || save.isPending}
              className="gap-2"
            >
              {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save policy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
