import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, KeyRound, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SSOSettingsCardProps {
  organizationId: string;
}

const SSO_PROVIDERS = [
  "Azure AD / Entra ID",
  "Okta",
  "Google Workspace",
  "ADFS (Active Directory Federation Services)",
  "OneLogin",
  "PingFederate",
  "Custom SAML 2.0",
];

interface SSOConfig {
  enabled: boolean;
  provider_name: string;
  metadata_url: string;
  idp_entity_id: string;
  idp_sso_url: string;
  attribute_email: string;
  attribute_name: string;
}

const DEFAULT_CONFIG: SSOConfig = {
  enabled: false,
  provider_name: "",
  metadata_url: "",
  idp_entity_id: "",
  idp_sso_url: "",
  attribute_email: "email",
  attribute_name: "displayName",
};

/**
 * SSOSettingsCard — FedRAMP G-06 (IA-2, IA-8, AC-2)
 *
 * Allows org admins to configure SAML 2.0 SSO for their organization.
 * Requires Supabase Enterprise plan for live SAML token processing.
 * This UI stores the configuration, which is read by the Supabase SAML
 * integration layer when a user initiates SSO.
 */
export function SSOSettingsCard({ organizationId }: SSOSettingsCardProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<SSOConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("sso_configurations" as never)
        .select("enabled, provider_name, metadata_url, idp_entity_id, idp_sso_url, attribute_email, attribute_name")
        .eq("organization_id", organizationId)
        .maybeSingle<SSOConfig>();

      if (isMounted && data) {
        setConfig({ ...DEFAULT_CONFIG, ...data });
      }
      if (isMounted) setLoading(false);
    };

    void load();
    return () => { isMounted = false; };
  }, [organizationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sso_configurations" as never)
        .upsert(
          { organization_id: organizationId, ...config } as never,
          { onConflict: "organization_id" }
        );

      if (error) {
        toast({ title: "Failed to save SSO settings", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "SSO settings saved" });
    } finally {
      setSaving(false);
    }
  };

  // SP (Service Provider) values to give to the IdP admin
  const spEntityId = `https://jobline.ai/auth/saml/metadata`;
  const acsUrl     = `https://jobline.ai/auth/saml/acs`;

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
          <KeyRound className="h-5 w-5" />
          SAML 2.0 / SSO Configuration
          <Badge variant="outline" className="ml-auto text-xs">Enterprise</Badge>
        </CardTitle>
        <CardDescription>
          Allow members to sign in with your organization's identity provider (Azure AD, Okta, Google Workspace, etc.).
          FedRAMP G-06 — IA-2, IA-8, AC-2.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Live SAML token processing requires the{" "}
            <strong>Supabase Enterprise plan</strong>. The configuration stored here will be
            activated automatically when the Enterprise plan is enabled on this project.{" "}
            <a
              href="https://supabase.com/enterprise"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Enable SSO</p>
            <p className="text-sm text-muted-foreground">
              When enabled, members can use your IdP to sign in. Password login remains available.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
            aria-label="Enable SSO"
          />
        </div>

        {/* Provider name */}
        <div className="space-y-2">
          <Label>Identity Provider</Label>
          <select
            value={config.provider_name}
            onChange={(e) => setConfig((c) => ({ ...c, provider_name: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select your IdP…</option>
            {SSO_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Metadata URL */}
        <div className="space-y-2">
          <Label>IdP Metadata URL</Label>
          <Input
            value={config.metadata_url}
            onChange={(e) => setConfig((c) => ({ ...c, metadata_url: e.target.value }))}
            placeholder="https://login.microsoftonline.com/<tenant>/federationmetadata/2007-06/federationmetadata.xml"
          />
          <p className="text-xs text-muted-foreground">
            Paste your IdP's SAML 2.0 metadata URL. The Entity ID, SSO URL, and certificate will be
            read automatically.
          </p>
        </div>

        {/* Manual fallback fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>IdP Entity ID (manual)</Label>
            <Input
              value={config.idp_entity_id}
              onChange={(e) => setConfig((c) => ({ ...c, idp_entity_id: e.target.value }))}
              placeholder="https://sts.windows.net/<tenant>/"
            />
          </div>
          <div className="space-y-2">
            <Label>IdP SSO URL (manual)</Label>
            <Input
              value={config.idp_sso_url}
              onChange={(e) => setConfig((c) => ({ ...c, idp_sso_url: e.target.value }))}
              placeholder="https://login.microsoftonline.com/<tenant>/saml2"
            />
          </div>
        </div>

        {/* Attribute mapping */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email attribute name</Label>
            <Input
              value={config.attribute_email}
              onChange={(e) => setConfig((c) => ({ ...c, attribute_email: e.target.value }))}
              placeholder="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Display name attribute</Label>
            <Input
              value={config.attribute_name}
              onChange={(e) => setConfig((c) => ({ ...c, attribute_name: e.target.value }))}
              placeholder="displayName"
            />
          </div>
        </div>

        {/* SP values to give to IdP admin */}
        <div className="rounded-md border bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium">
            Service Provider (SP) values — provide these to your IdP administrator:
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-36 shrink-0 text-muted-foreground">SP Entity ID:</span>
              <code className="font-mono text-xs break-all">{spEntityId}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-36 shrink-0 text-muted-foreground">ACS URL:</span>
              <code className="font-mono text-xs break-all">{acsUrl}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-36 shrink-0 text-muted-foreground">Name ID format:</span>
              <code className="font-mono text-xs">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</code>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save SSO Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
