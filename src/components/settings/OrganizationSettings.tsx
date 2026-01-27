import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Building2, Users, Crown, Mail } from "lucide-react";
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

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || "",
        billing_email: "",
      });
    }
  }, [organization]);

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
    </div>
  );
}
