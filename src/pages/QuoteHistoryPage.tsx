import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { QuoteHistory } from "@/components/admin/QuoteHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";

export default function QuoteHistoryPage() {
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
        <title>Quote History | JobLine.ai</title>
        <meta name="description" content="Search, view, and export completed quotes. Export to Excel or QuickBooks-compatible CSV formats." />
      </Helmet>
      <Header />
      <main className="container py-6 space-y-6">
        {canAccess ? (
          <QuoteHistory />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileQuestion className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">Quote History</h1>
            <p className="text-muted-foreground mt-2">
              You need supervisor or admin access to view quote history.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
