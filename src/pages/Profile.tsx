import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Building2, Users, Shield, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnboardingProgress } from "@/components/onboarding";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAdminAccess } from "@/hooks/useAdminData";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { 
    organization, 
    organizationRole, 
    teams, 
    primaryRole, 
    loading: orgLoading 
  } = useOrgContext();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setIsDirty(false);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsDirty(false);
      await refreshProfile();
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    }
  };

  if (loading || orgLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = displayName?.charAt(0).toUpperCase() || "?";

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "supervisor": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "operator": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "owner": return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName || "No name set"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getRoleBadgeColor(primaryRole)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setIsDirty(e.target.value.trim() !== (profile?.display_name || ""));
                }}
                placeholder="Your name"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear in handoffs and team lists.
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving || !isDirty || !displayName.trim()} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isDirty ? "Save Changes" : "Saved"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Organization & Teams Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization & Teams
            </CardTitle>
            <CardDescription>
              Your workspace and team memberships
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Organization */}
            {organization ? (
              <div className="p-4 rounded-lg border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{organization.name}</p>
                      {organization.description && (
                        <p className="text-xs text-muted-foreground">{organization.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {organizationRole && (
                      <Badge variant="outline" className={getRoleBadgeColor(organizationRole)}>
                        <Briefcase className="w-3 h-3 mr-1" />
                        {organizationRole.charAt(0).toUpperCase() + organizationRole.slice(1)}
                      </Badge>
                    )}
                    {/* Only show subscription tier to developers */}
                    {isDeveloper && organization.subscription_tier && (
                      <Badge variant="secondary">
                        {organization.subscription_tier}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No organization assigned</p>
                <p className="text-xs text-muted-foreground">Contact your administrator to be added to an organization</p>
              </div>
            )}

            {/* Teams */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Teams</Label>
              {teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((membership) => (
                    <div 
                      key={membership.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-blue-500/10">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{membership.team.name}</p>
                          {membership.team.description && (
                            <p className="text-xs text-muted-foreground">{membership.team.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getRoleBadgeColor(membership.role)}>
                        {membership.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
                  <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No team memberships</p>
                  <p className="text-xs text-muted-foreground">You'll be added to teams by your administrator</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Progress Card */}
        <OnboardingProgress showRestart />
      </main>
    </div>
  );
}
