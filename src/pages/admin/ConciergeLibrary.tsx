import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentLibrary } from "@/components/admin/concierge/DocumentLibrary";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConciergeLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isDeveloper, loading: rolesLoading } = useAdminAccess();

  if (authLoading || rolesLoading) return <Skeleton className="h-screen w-full" />;
  if (!user || !(isAdmin || isDeveloper)) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Restricted to JobLine platform admins.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 py-6 px-4">
      <Helmet>
        <title>Concierge Document Library · JobLine.ai</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Concierge Document Library</CardTitle>
            <CardDescription>
              Internal staff workspace. Download MSA, NDA, ITAR declaration, intake worksheets (matching the in-app and Excel template fields exactly), and onboarding SOPs. Use this when running paper-based onboarding or preparing a customer pack ahead of a kickoff call.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Tip: open a specific engagement and use its Documents tab to get the same library with customer name, plan, and amount pre-filled.
          </CardContent>
        </Card>
        <DocumentLibrary audience="all" />
      </div>
    </div>
  );
}
