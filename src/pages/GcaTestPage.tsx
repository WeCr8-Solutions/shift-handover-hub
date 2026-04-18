import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { GcaTestPlayer } from "@/components/gca/GcaTestPlayer";
import { useGcaAccess } from "@/hooks/useGcaAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GcaTestPage() {
  const { bankSlug } = useParams<{ bankSlug: string }>();
  const { hasProAccess, isDefinitelyFree, isLoading, startGcaCheckout } = useGcaAccess();

  const { data: bank } = useQuery({
    queryKey: ["gca-bank-meta", bankSlug],
    enabled: !!bankSlug,
    queryFn: async () => {
      const { data } = await supabase
        .from("gca_question_banks")
        .select("title, topic, description, difficulty, is_pro_only")
        .eq("slug", bankSlug!)
        .maybeSingle();
      return data;
    },
  });

  const handleUpgrade = async () => {
    try {
      await startGcaCheckout("monthly");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unable to start checkout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{bank ? `${bank.title} Test — GCA` : "GCA Test"} · JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
            <Link to="/gcode-academy">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold">{bank?.title ?? "Loading…"}</h1>
            {bank && (
              <Badge variant="outline" className="capitalize">{bank.difficulty}</Badge>
            )}
            {bank?.is_pro_only && (
              <Badge variant="secondary">Pro</Badge>
            )}
          </div>
        </div>

        {bank?.description && (
          <p className="text-sm text-muted-foreground">{bank.description}</p>
        )}

        {isDefinitelyFree && bank?.is_pro_only && (
          <Card>
            <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                This test bank requires <strong>GCA Pro</strong>.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpgrade()}>
                  Upgrade — $19/mo
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/pricing">See all plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && bankSlug && (
          <GcaTestPlayer
            bankSlug={bankSlug}
            hasProAccess={hasProAccess}
            onUpgrade={handleUpgrade}
          />
        )}
      </main>
    </div>
  );
}
