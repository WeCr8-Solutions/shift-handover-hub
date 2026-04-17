import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { OapEmployerPanel } from "@/components/oap/OapEmployerPanel";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, ShieldAlert } from "lucide-react";

export default function OapEmployer() {
  const { organization } = useOrganization();
  const { hasOrgAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const allowed = hasOrgAdminAccess || hasOrgSupervisorAccess;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>OAP Employer Console — JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">OAP Employer Console</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Define your shop's role programs (what "Floor-Certified" means for each
          role) and enroll operators.{" "}
          {organization?.name && <strong>{organization.name}</strong>}
        </p>

        {!allowed ? (
          <Card>
            <CardContent className="py-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="w-4 h-4" />
              Employer console is available to org admins and supervisors.
            </CardContent>
          </Card>
        ) : (
          <OapEmployerPanel />
        )}
      </main>
    </div>
  );
}
