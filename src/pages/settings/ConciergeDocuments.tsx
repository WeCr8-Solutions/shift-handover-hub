import { Helmet } from "react-helmet-async";
import { DocumentLibrary } from "@/components/admin/concierge/DocumentLibrary";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConciergeDocuments() {
  const { user, loading } = useAuth();
  if (loading) return <Skeleton className="h-screen w-full" />;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Sign in to view your concierge documents.</div>;

  return (
    <div className="min-h-screen bg-muted/20 py-6 px-4">
      <Helmet>
        <title>Concierge Documents · JobLine.ai</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <DocumentLibrary
          audience="customer"
          title="Your concierge documents"
          description="Download your Master Services Agreement, ITAR declaration, payment instructions, and the same intake worksheets used during your onboarding — as PDF, editable DOCX, or Excel."
        />
      </div>
    </div>
  );
}
