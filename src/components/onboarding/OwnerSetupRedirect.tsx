/**
 * OwnerSetupRedirect — wraps a protected route. If the current user is an
 * owner/admin of an organization that is not yet "open for operations" and
 * has not opted into Explore Only mode, send them to /welcome.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useOwnerSetupGate } from "@/hooks/useOwnerSetupGate";

interface Props {
  children: React.ReactNode;
}

export function OwnerSetupRedirect({ children }: Props) {
  const { loading, mustRedirect } = useOwnerSetupGate();
  const location = useLocation();
  if (loading) return null;
  if (mustRedirect && !location.pathname.startsWith("/welcome")) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}
