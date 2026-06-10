import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldAlert, Loader2 } from "lucide-react";
import { useOrgProfile, type OrgProfileRow } from "@/hooks/useOrgProfileAdmin";

const TIERS = ["free","single","team","enterprise"];
const STATUSES = ["trial","active","past_due","canceled","paused"];

interface Props { organizationId: string | null }

export function OrgProfileQuickEditPanel({ organizationId }: Props) {
  const { query, update } = useOrgProfile(organizationId);
  const [form, setForm] = useState<Partial<OrgProfileRow>>({});

  useEffect(() => {
    if (query.data) setForm({
      name: query.data.name,
      slug: query.data.slug,
      billing_email: query.data.billing_email ?? "",
      subscription_tier: query.data.subscription_tier ?? "free",
      subscription_status: query.data.subscription_status ?? "trial",
      mfa_required: query.data.mfa_required,
      ai_enabled: query.data.ai_enabled,
      description: query.data.description ?? "",
    });
  }, [query.data]);

  const isItar = query.data?.requires_us_person_declaration === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-4 h-4" /> Organization profile
          {isItar && (
            <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
              <ShieldAlert className="w-3 h-3" /> ITAR
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Fix typos, change tier, toggle MFA / AI gateway. ITAR flag is read-only here — switching it has compliance side-effects and must be done from platform settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Slug</Label>
            <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Billing email</Label>
            <Input type="email" value={form.billing_email ?? ""} onChange={(e) => setForm({ ...form, billing_email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subscription tier</Label>
            <Select value={form.subscription_tier ?? "free"} onValueChange={(v) => setForm({ ...form, subscription_tier: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subscription status</Label>
            <Select value={form.subscription_status ?? "trial"} onValueChange={(v) => setForm({ ...form, subscription_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <Label className="text-xs">MFA required</Label>
            <Switch checked={!!form.mfa_required} onCheckedChange={(v) => setForm({ ...form, mfa_required: v })} />
          </div>
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <Label className="text-xs">AI gateway enabled</Label>
            <Switch checked={!!form.ai_enabled} onCheckedChange={(v) => setForm({ ...form, ai_enabled: v })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => update.mutate(form)} disabled={update.isPending} className="gap-2">
            {update.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
