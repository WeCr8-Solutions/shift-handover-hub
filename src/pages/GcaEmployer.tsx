import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { GcaEmployerPanel } from "@/components/gca/GcaEmployerPanel";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrganization } from "@/hooks/useOrganization";
import { GraduationCap } from "lucide-react";
import { PermissionAwareEmpty } from "@/components/shared/PermissionAwareEmpty";

export default function GcaEmployer() {
  const { organization } = useOrganization();
  const { hasOrgAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const allowed = hasOrgAdminAccess || hasOrgSupervisorAccess;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>GCA Employer Console — JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">GCA Employer Console</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Assign G-Code Academy coursework to your operators and track their
          progress.{" "}
          {organization?.name && <strong>{organization.name}</strong>}
        </p>

        {!allowed ? (
          <PermissionAwareEmpty
            mode="permission"
            title="Employer access required"
            description="The GCA Employer Console is available to org admins and supervisors."
          />
        ) : (
          <GcaEmployerPanel />
        )}
      </main>
    </div>
  );
}
