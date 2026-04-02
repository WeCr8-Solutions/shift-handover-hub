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
          <WorkOrderHistory isAdmin={hasAdminAccess} showQuickBooksExport />
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
