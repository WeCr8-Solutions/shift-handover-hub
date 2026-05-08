/**
 * Route-level guards for role / org / subscription gating.
 * Per .lovable/auth-onboarding-pipeline-audit.md F-9.
 *
 * These are defense-in-depth wrappers. The real source of truth is RLS +
 * server-side triggers, but these prevent unguarded pages from mounting and
 * surface a coherent forbidden state instead of an empty UI.
 */
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrgContext } from "@/contexts/OrgContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";

function ForbiddenCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingPane() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const location = useLocation();
  if (!isReady) return <LoadingPane />;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

export function RequireOrg({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const { organization, loading } = useOrgContext();
  const location = useLocation();
  if (!isReady || loading) return <LoadingPane />;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!organization) {
    return (
      <ForbiddenCard
        title="Organization required"
        description="This page requires an active organization. Create or join one to continue."
      />
    );
  }
  return <>{children}</>;
}

type Role = "platform_admin" | "developer" | "org_owner" | "org_admin" | "org_supervisor";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { isReady, user } = useAuth();
  const { isAdmin, isDeveloper, isOrgOwner, isOrgAdmin, hasOrgSupervisorAccess, loading } = useAdminAccess();
  if (!isReady || loading) return <LoadingPane />;
  if (!user) return <Navigate to="/auth" replace />;

  const allow =
    (roles.includes("platform_admin") && isAdmin) ||
    (roles.includes("developer") && isDeveloper) ||
    (roles.includes("org_owner") && isOrgOwner) ||
    (roles.includes("org_admin") && isOrgAdmin) ||
    (roles.includes("org_supervisor") && hasOrgSupervisorAccess);

  if (!allow) {
    return (
      <ForbiddenCard
        title="Access restricted"
        description="Your account doesn't have the required role for this page."
      />
    );
  }
  return <>{children}</>;
}

/**
 * Requires an active paid subscription on the current org.
 * Platform admins bypass.
 */
export function RequireSubscription({ children }: { children: ReactNode }) {
  const { isReady } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminAccess();
  const { subscribed, isLoading: subLoading } = useSubscription();
  if (!isReady || roleLoading || subLoading) return <LoadingPane />;
  if (isAdmin) return <>{children}</>;
  if (!subscribed) {
    return (
      <ForbiddenCard
        title="Paid subscription required"
        description="This feature is part of a paid plan. Upgrade your subscription to continue."
      />
    );
  }
  return <>{children}</>;
}
