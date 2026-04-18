import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Send, Radio, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

interface SIEMSettingsCardProps {
  organizationId: string;
}

const PROVIDER_TYPES = [
  { value: "splunk",   label: "Splunk (HTTP Event Collector)" },
  { value: "sentinel", label: "Microsoft Sentinel (Log Ingestion API)" },
  { value: "qradar",   label: "IBM QRadar (Syslog / REST)" },
  { value: "elastic",  label: "Elastic SIEM (Logstash / Beats)" },
  { value: "custom",   label: "Custom HTTP endpoint" },
];

const EVENT_FORMATS = [
  { value: "json", label: "JSON" },
  { value: "cef",  label: "CEF (ArcSight Common Event Format)" },
];

const SEVERITIES = ["debug", "info", "warning", "error"];

interface SIEMConfig {
  enabled: boolean;
  provider_type: string;
  endpoint_url: string;
  auth_header_name: string;
  auth_token: string;
  event_format: string;
  min_severity: string;
  last_export_at: string | null;
  export_error_count: number;
}

const DEFAULT_CONFIG: SIEMConfig = {
  enabled: false,
  provider_type: "custom",
  endpoint_url: "",
  auth_header_name: "Authorization",
  auth_token: "",
  event_format: "json",
  min_severity: "info",
  last_export_at: null,
  export_error_count: 0,
};

/**
 * SIEMSettingsCard — FedRAMP G-07 (AU-6, AU-9)
 *
 * Configures SIEM log forwarding for this organization. Events from the
 * activity_logs table are pushed to the configured endpoint via the
 * log-export edge function.
 */
export function SIEMSettingsCard({ organizationId }: SIEMSettingsCardProps) {
  const { toast } = useToast();
  const { organization } = useOrgContext();
  const [config, setConfig] = useState<SIEMConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("siem_configurations" as never)
        .select("enabled, provider_type, endpoint_url, auth_header_name, auth_token, event_format, min_severity, last_export_at, export_error_count")
        .eq("organization_id", organizationId)
        .maybeSingle<SIEMConfig>();

      if (isMounted && data) {
        // Mask auth_token for display — show placeholder if set
        setConfig({ ...DEFAULT_CONFIG, ...data, auth_token: data.auth_token ? "••••••••" : "" });
      }
      if (isMounted) setLoading(false);
    };

    void load();
    return () => { isMounted = false; };
  }, [organizationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        organization_id: organizationId,
        enabled: config.enabled,
        provider_type: config.provider_type,
        endpoint_url: config.endpoint_url,
        auth_header_name: config.auth_header_name,
        event_format: config.event_format,
        min_severity: config.min_severity,
      };

      // Only update token if it was actually changed (not the placeholder)
      if (config.auth_token && !config.auth_token.startsWith("•")) {
        payload.auth_token = config.auth_token;
      }

      const { error } = await supabase
        .from("siem_configurations" as never)
        .upsert(payload as never, { onConflict: "organization_id" });

      if (error) {
        toast({ title: "Failed to save SIEM settings", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "SIEM settings saved" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.endpoint_url) {
      toast({ title: "Enter an endpoint URL first", variant: "destructive" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("log-export", {
        body: {
          org_id: organizationId,
          event: {
            activity_type: "siem_test",
            description: `SIEM connectivity test from JobLine admin UI — org: ${organization?.name ?? organizationId}`,
            severity: "info",
            created_at: new Date().toISOString(),
          },
        },
      });

      if (error || data?.ok === false) {
        setTestResult("error");
        toast({
          title: "SIEM test failed",
          description: error?.message ?? data?.error ?? "Check endpoint URL and auth token",
          variant: "destructive",
        });
      } else {
        setTestResult("success");
        toast({ title: "Test event sent successfully" });
      }
    } catch (err) {
      setTestResult("error");
      toast({ title: "Test failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          SIEM Log Export
          {config.export_error_count > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {config.export_error_count} export error{config.export_error_count !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Forward audit log events to your SIEM (Splunk, Microsoft Sentinel, QRadar, etc.).
          FedRAMP G-07 — AU-6, AU-9.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Enable SIEM Export</p>
            <p className="text-sm text-muted-foreground">
              Push activity log events to your SIEM endpoint in real-time.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
            aria-label="Enable SIEM export"
          />
        </div>

        {/* Status */}
        {config.last_export_at && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Last successful export: {new Date(config.last_export_at).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Provider */}
        <div className="space-y-2">
          <Label>SIEM Provider</Label>
          <select
            value={config.provider_type}
            onChange={(e) => setConfig((c) => ({ ...c, provider_type: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PROVIDER_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Endpoint URL */}
        <div className="space-y-2">
          <Label>Ingest Endpoint URL</Label>
          <Input
            value={config.endpoint_url}
            onChange={(e) => setConfig((c) => ({ ...c, endpoint_url: e.target.value }))}
            placeholder={
              config.provider_type === "splunk"
                ? "https://your-splunk.example.com:8088/services/collector"
                : config.provider_type === "sentinel"
                ? "https://<workspace>.ods.opinsights.azure.com/api/logs?api-version=2016-04-01"
                : "https://your-siem.example.com/ingest"
            }
          />
        </div>

        {/* Auth */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Auth Header Name</Label>
            <Input
              value={config.auth_header_name}
              onChange={(e) => setConfig((c) => ({ ...c, auth_header_name: e.target.value }))}
              placeholder="Authorization"
            />
          </div>
          <div className="space-y-2">
            <Label>Auth Token / API Key</Label>
            <Input
              type="password"
              value={config.auth_token}
              onChange={(e) => setConfig((c) => ({ ...c, auth_token: e.target.value }))}
              placeholder={config.provider_type === "splunk" ? "Splunk HEC token" : "Bearer <token>"}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Format + Min severity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Event Format</Label>
            <select
              value={config.event_format}
              onChange={(e) => setConfig((c) => ({ ...c, event_format: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {EVENT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Minimum Severity</Label>
            <select
              value={config.min_severity}
              onChange={(e) => setConfig((c) => ({ ...c, min_severity: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Only events at or above this level are forwarded.</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || saving}
            className="gap-2"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : testResult === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : testResult === "error" ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Test Event
          </Button>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save SIEM Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
