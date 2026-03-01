import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Building2, Users, Crown, Mail, Shield, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizationSettingsProps {
  isDeveloper?: boolean;
}

export function OrganizationSettings({ isDeveloper = false }: OrganizationSettingsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization, organizationRole, teams, loading, refresh } = useUserOrganization();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    billing_email: "",
  });

  // ITAR compliance toggles
  const [mfaRequired, setMfaRequired] = useState(false);
  const [requiresUsPerson, setRequiresUsPerson] = useState(false);
  const [savingCompliance, setSavingCompliance] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || "",
        billing_email: "",
      });
    }
  }, [organization]);

  // Load ITAR compliance settings (fields added by v1.2 migration)
  useEffect(() => {
    if (!organization) return;
    supabase
      .from("organizations")
      .select("mfa_required, requires_us_person_declaration")
      .eq("id", organization.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMfaRequired(data.mfa_required ?? false);
          setRequiresUsPerson(data.requires_us_person_declaration ?? false);
        }
      });
  }, [organization]);

  const handleSaveCompliance = async () => {
    if (!organization) return;
    setSavingCompliance(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        mfa_required: mfaRequired,
        requires_us_person_declaration: requiresUsPerson,
      })
      .eq("id", organization.id);
    setSavingCompliance(false);
    if (error) {
      toast({ title: "Failed to update compliance settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compliance settings saved" });
    }
  };

  const handleSave = async () => {
    if (!organization || !user) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: formData.name,
        description: formData.description || null,
        billing_email: formData.billing_email || null,
      })
      .eq("id", organization.id);

    setIsSaving(false);

    if (error) {
      toast({ title: "Failed to update organization", description: error.message, variant: "destructive" });
    } else {
      await refresh();
      toast({ title: "Organization updated" });
    }
  };

  const isAdmin = organizationRole === "admin" || organizationRole === "owner";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Organization</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You're not part of an organization yet. Create one during onboarding or ask to be invited.
          </p>
          <Button onClick={() => window.location.href = "/setup"}>
            Go to Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            {isAdmin ? "Manage your organization's information" : "View your organization's information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border">
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{organization.name}</h3>
              <p className="text-sm text-muted-foreground">Slug: {organization.slug}</p>
            </div>
            {/* Only show subscription badges to developers */}
            {isDeveloper && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {organization.subscription_tier || "Free"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {organization.subscription_status || "Trial"}
                </Badge>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your Organization"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of your organization"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Billing Email
                </Label>
                <Input
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData(p => ({ ...p, billing_email: e.target.value }))}
                  placeholder="billing@company.com"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Role & Teams
          </CardTitle>
          <CardDescription>
            Your membership and access within the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium">Organization Role</p>
                <p className="text-sm text-muted-foreground">Your role in {organization.name}</p>
              </div>
            </div>
            <Badge className="capitalize">{organizationRole}</Badge>
          </div>

          <div className="space-y-2">
            <Label>Teams ({teams.length})</Label>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                You're not a member of any teams yet
              </p>
            ) : (
              <div className="space-y-2">
                {teams.map(membership => (
                  <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{membership.team.name}</p>
                        {membership.team.description && (
                          <p className="text-xs text-muted-foreground">{membership.team.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{membership.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Organization Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* ITAR Compliance Settings — visible to org admins/owners only */}
      {isAdmin && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Shield className="w-5 h-5" />
              ITAR / Export Control Settings
            </CardTitle>
            <CardDescription>
              Configure access controls required for ITAR-regulated deployments.
              These settings apply to all members of this organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Require Multi-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, all members must enroll a TOTP authenticator app
                  before accessing org data. Recommended for all ITAR deployments.
                </p>
              </div>
              <Switch
                checked={mfaRequired}
                onCheckedChange={setMfaRequired}
                aria-label="Require MFA"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Require US Person Declaration
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, all members must self-certify as a US Person
                  (22 C.F.R. § 120.15) before accessing org data. Required when
                  this system is used with ITAR-controlled technical data.
                </p>
              </div>
              <Switch
                checked={requiresUsPerson}
                onCheckedChange={setRequiresUsPerson}
                aria-label="Require US Person declaration"
              />
            </div>

            <div className="pt-2 border-t flex justify-end">
              <Button
                onClick={handleSaveCompliance}
                disabled={savingCompliance}
                variant="outline"
                className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              >
                {savingCompliance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Compliance Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
