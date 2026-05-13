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
import { Loader2, Save, Building2, Users, Shield, Briefcase, Sparkles, ExternalLink, Globe, Lock, ShieldCheck, ArrowRight, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnboardingProgress } from "@/components/onboarding";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOperatorProfile } from "@/hooks/useOperatorProfile";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, isReady } = useAuth();
  const { toast } = useToast();
  const { 
    organization, 
    organizationRole, 
    teams, 
    primaryRole, 
    loading: orgLoading 
  } = useOrgContext();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { profile: talentProfile, certifications, skills, machines, workHistory } = useOperatorProfile();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth");
    }
  }, [isReady, user, navigate]);

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

  const verifiedCerts = certifications.filter((cert) => cert.verification_source.startsWith("verified_"));
  const latestVerifiedCerts = verifiedCerts.slice(0, 3);

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

        {/* Talent Profile Card — entry point to public talent presence */}
        {(() => {
          const visibility = talentProfile?.profile_visibility ?? "private";
          const VisIcon = visibility === "public" ? Globe : visibility === "employers_only" ? ShieldCheck : Lock;
          const visLabel = visibility === "public" ? "Public" : visibility === "employers_only" ? "Employers only" : "Private";
          const publicUrl = talentProfile?.public_username ? getPublicTalentUrl(talentProfile.public_username) : null;
          const checks = talentProfile ? [
            !!talentProfile.headline,
            !!talentProfile.bio,
            !!talentProfile.location_city,
            (talentProfile.years_experience ?? 0) > 0,
            certifications.length > 0,
            skills.length > 0,
            machines.length > 0,
            workHistory.length > 0,
          ] : [];
          const completeness = checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 0;

          return (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="w-5 h-5 text-primary" />
                  Talent Network Profile
                </CardTitle>
                <CardDescription>
                  Your portable, employer-facing operator profile. Lives with you across every shop.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!talentProfile ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-primary mx-auto" />
                    <div>
                      <p className="font-medium text-sm">You haven't built your talent profile yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Showcase verified certs, machines, and experience. Upload a resume for instant autofill.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button onClick={() => navigate("/operator/profile")} size="sm" className="gap-2">
                        <Sparkles className="w-4 h-4" /> Build Talent Profile
                      </Button>
                      <Button
                        onClick={() => navigate("/operator/profile?tab=resume")}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        data-testid="profile-upload-resume"
                      >
                        <FileText className="w-4 h-4" /> Upload Resume
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Strength</p>
                        <p className="text-2xl font-bold leading-none mt-1">{completeness}%</p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Verified</p>
                        <p className="text-2xl font-bold leading-none mt-1">
                          {verifiedCerts.length}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Visibility</p>
                        <Badge variant="outline" className="mt-1 gap-1">
                          <VisIcon className="w-3 h-3" /> {visLabel}
                        </Badge>
                      </div>
                    </div>

                    {latestVerifiedCerts.length > 0 && (
                      <div className="rounded-lg border bg-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <p className="text-sm font-medium">Attached certificate numbers</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {latestVerifiedCerts.map((cert) => (
                            <Badge key={cert.id} variant="outline" className="font-mono max-w-full truncate">
                              {cert.linked_cert_id ?? cert.credential_id ?? cert.name}
                            </Badge>
                          ))}
                        </div>
                        {verifiedCerts.length > latestVerifiedCerts.length && (
                          <p className="text-xs text-muted-foreground">
                            {verifiedCerts.length - latestVerifiedCerts.length} more certificate number(s) are listed in your talent profile.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => navigate("/talent/dashboard")} size="sm" variant="default" className="gap-2">
                        Talent Dashboard <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => navigate("/talent/profile")} size="sm" variant="outline" className="gap-2">
                        Edit Profile
                      </Button>
                      {publicUrl && (
                        <Button asChild size="sm" variant="outline" className="gap-2">
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            View Public <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Onboarding Progress Card */}
        <OnboardingProgress showRestart />
      </main>
    </div>
  );
}
