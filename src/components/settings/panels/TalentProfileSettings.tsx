import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Lock, ShieldCheck, ExternalLink, IdCard } from "lucide-react";
import { useOperatorProfile } from "@/hooks/useOperatorProfile";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";

/**
 * Talent Profile settings module — summary + deep-link to the full editor at
 * /operator-profile. Lives under "Personal" in Settings so users can find
 * talent-network controls without leaving Settings entirely.
 */
export default function TalentProfileSettings() {
  const { profile, loading } = useOperatorProfile();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const visibility = profile?.profile_visibility ?? "private";
  const VisIcon = visibility === "public" ? Globe : visibility === "employers_only" ? ShieldCheck : Lock;
  const visLabel =
    visibility === "public" ? "Public" : visibility === "employers_only" ? "Employers only" : "Private";
  const publicUrl = profile?.public_username ? getPublicTalentUrl(profile.public_username) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Talent Profile
          </CardTitle>
          <CardDescription>
            Your public presence on the JobLine Talent Network. Controls who can see your profile and
            how employers reach out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Visibility</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <VisIcon className="h-4 w-4" />
                {visLabel}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Open to work</div>
              <div className="mt-1">
                <Badge variant={profile?.open_to_work ? "default" : "outline"}>
                  {profile?.open_to_work ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Public username</div>
              <div className="mt-1 truncate text-sm font-medium">
                {profile?.public_username ?? <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/operator-profile">Edit Talent Profile</Link>
            </Button>
            {publicUrl && (
              <Button variant="outline" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  View public profile <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button variant="ghost" asChild>
              <Link to="/talent">Talent Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Why this lives here</CardTitle>
          <CardDescription>
            The Talent Network is a personal surface, separate from your shop's shift-handoff
            settings. Organization admins cannot edit your talent profile — only you can.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
