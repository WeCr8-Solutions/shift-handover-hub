import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Database, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ErpPayload {
  enabled?: boolean;
  system?: "native" | "jobboss" | "sap";
  base_url?: string;
  auth_method?: string;
  persistence_mode?: "read_through" | "write_through";
  notes?: string;
}

export function IntakeErpEditor({
  engagementId,
  organizationId,
  isItar,
}: {
  engagementId: string;
  organizationId: string;
  isItar?: boolean;
}) {
  const qc = useQueryClient();
  const { data: initial, isLoading } = useQuery({
    queryKey: ["intake-erp", engagementId],
    queryFn: async (): Promise<ErpPayload> => {
      const { data, error } = await supabase
        .from("onboarding_intake_responses")
        .select("payload")
        .eq("engagement_id", engagementId)
        .eq("module_key", "erp")
        .maybeSingle();
      if (error) throw error;
      return (data?.payload as ErpPayload) ?? { enabled: false };
    },
  });

  const [form, setForm] = useState<ErpPayload>({ enabled: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: ErpPayload = { ...form };
      if (isItar && payload.enabled) payload.persistence_mode = "read_through";
      if (!payload.enabled) {
        payload.system = undefined;
        payload.base_url = undefined;
        payload.persistence_mode = undefined;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("onboarding_intake_responses")
        .upsert(
          {
            engagement_id: engagementId,
            organization_id: organizationId,
            module_key: "erp",
            payload: payload as any,
            submitted_by: userRes.user?.id ?? null,
          },
          { onConflict: "engagement_id,module_key" },
        );
      if (error) throw error;
      toast.success("ERP configuration saved");
      qc.invalidateQueries({ queryKey: ["intake-erp", engagementId] });
    } catch (e: any) {
      toast.error("Failed to save", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> ERP integration
          {isItar && (
            <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive text-[10px]">
              <ShieldAlert className="w-3 h-3" /> ITAR: read-through enforced
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Does this customer want to connect an ERP system, or run native-only?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="font-medium">Connect an ERP</Label>
            <p className="text-xs text-muted-foreground">Toggle off to run Jobline native (no external ERP).</p>
          </div>
          <Switch
            checked={!!form.enabled}
            onCheckedChange={(v) => setForm({ ...form, enabled: v })}
          />
        </div>

        {form.enabled && (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">System</Label>
                <Select value={form.system ?? ""} onValueChange={(v: any) => setForm({ ...form, system: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose system" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jobboss">JobBOSS / JobBOSS²</SelectItem>
                    <SelectItem value="sap">SAP S/4HANA</SelectItem>
                    <SelectItem value="native">Native (custom REST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Persistence mode</Label>
                <Select
                  value={isItar ? "read_through" : (form.persistence_mode ?? "read_through")}
                  onValueChange={(v: any) => setForm({ ...form, persistence_mode: v })}
                  disabled={isItar}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read_through">Read-through (no Supabase persistence)</SelectItem>
                    <SelectItem value="write_through" disabled={isItar}>Write-through (cache into Jobline)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Base URL</Label>
                <Input
                  value={form.base_url ?? ""}
                  onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                  placeholder="https://erp.customer.com/api"
                />
              </div>
              <div>
                <Label className="text-xs">Auth method</Label>
                <Input
                  value={form.auth_method ?? ""}
                  onChange={(e) => setForm({ ...form, auth_method: e.target.value })}
                  placeholder="OAuth2 / Basic / API key"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Field mappings, IP allow-list, etc."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save ERP config"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
