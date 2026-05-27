import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { WorkOrderHistory } from "@/components/admin/WorkOrderHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { History } from "lucide-react";

export default function WorkOrderHistoryPage() {
  const { user } = useAuth();
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const canAccess = hasAdminAccess || hasOrgSupervisorAccess;

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Work Order History | JobLine.ai</title>
        <meta name="description" content="Search, view, and export completed work orders with full production data. Export to Excel or QuickBooks-compatible formats." />
      </Helmet>
      <Header />
      <main className="container py-6 space-y-6">
        {canAccess ? (
          <>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="font-semibold">Need station-level audit data?</div>
                <p className="text-sm text-muted-foreground">Open the full Audit & History Center for AS9100 / ISO 9001 / ITAR bundles by month.</p>
              </div>
              <a href="/admin?tab=history&view=stations" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">Open Audit Center →</a>
            </div>
            <WorkOrderHistory isAdmin={hasAdminAccess} showQuickBooksExport />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">Work Order History</h1>
            <p className="text-muted-foreground mt-2">
              You need supervisor or admin access to view work order history.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
