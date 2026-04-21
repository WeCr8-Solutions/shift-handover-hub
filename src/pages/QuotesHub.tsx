import { HubLayout, HubCard } from "@/components/hubs/HubLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useQuoteSystem } from "@/hooks/useQuoteSystem";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, PlusCircle, History, CheckCircle2, ArrowRightLeft, BarChart3 } from "lucide-react";
import { Header } from "@/components/Header";
import { Helmet } from "react-helmet-async";

export default function QuotesHub() {
  const { user } = useAuth();
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const { isQuoteSystemEnabled, loading } = useQuoteSystem();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  if (!loading && !isQuoteSystemEnabled) {
    return (
      <>
        <Helmet>
          <title>Quotes | JobLine.ai</title>
        </Helmet>
        <Header />
        <main className="container py-20 flex flex-col items-center text-center">
          <FileQuestion className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Quote System Disabled</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Your organization hasn't enabled the quote-to-work-order workflow. An org admin can turn it on in Settings → Manufacturing.
          </p>
        </main>
      </>
    );
  }

  const canSeeHistory = hasAdminAccess || hasOrgSupervisorAccess;

  const cards: HubCard[] = [
    {
      title: "Create Quote",
      description: "Build a quote with engineering or programming routing for accurate costing.",
      to: "/?new=quote",
      icon: PlusCircle,
      cta: "New quote",
    },
    {
      title: "Active Quotes",
      description: "Quotes in draft, under review, or awaiting customer approval.",
      to: "/queue?view=list&type=quote&status=in_progress",
      icon: FileQuestion,
    },
    {
      title: "Approved Quotes",
      description: "Approved quotes ready to convert into work orders.",
      to: "/queue?view=list&type=quote&status=completed",
      icon: CheckCircle2,
    },
    {
      title: "All Quotes",
      description: "Browse every quote regardless of status.",
      to: "/queue?view=list&type=quote",
      icon: ArrowRightLeft,
    },
    {
      title: "Quote History",
      description: "Search completed quotes and export to Excel or QuickBooks.",
      to: "/quote-history",
      icon: History,
      disabled: !canSeeHistory,
      disabledReason: "Supervisor or admin access required.",
    },
    {
      title: "Quote Analytics",
      description: "Win rate, average value, and conversion to work order.",
      to: "/admin?tab=quote-analytics",
      icon: BarChart3,
      disabled: !canSeeHistory,
      disabledReason: "Supervisor or admin access required.",
    },
  ];

  return (
    <HubLayout
      title="Quotes | JobLine.ai"
      metaDescription="Central hub for creating, reviewing, and converting quotes — including engineering and programming routing."
      heading="Quotes"
      subheading="From RFQ to approved work order — track every estimate."
      cards={cards}
    />
  );
}
