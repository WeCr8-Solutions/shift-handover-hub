import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { GcaTestPlayer } from "@/components/gca/GcaTestPlayer";
import { useGcaAccess } from "@/hooks/useGcaAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, BookOpen, ChevronDown, Copy, GraduationCap } from "lucide-react";
import { GcaToolVideos } from "@/components/gca/GcaToolVideos";
import { getGcaToolSlugs } from "@/lib/gcaToolMap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrgContext } from "@/contexts/OrgContext";
import { PermissionAwareEmpty } from "@/components/shared/PermissionAwareEmpty";

interface BankMeta {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  difficulty: string;
  is_pro_only: boolean;
  learning_content: string | null;
  organization_id: string | null;
}

export default function GcaTestPage() {
  const { bankSlug } = useParams<{ bankSlug: string }>();
  const { hasProAccess, isDefinitelyFree, isLoading, startGcaCheckout } = useGcaAccess();
  const { isAdmin, hasOrgAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const { organization } = useOrgContext();
  const qc = useQueryClient();
  const [learningOpen, setLearningOpen] = useState(true);

  const { data: bank } = useQuery({
    queryKey: ["gca-bank-meta", bankSlug],
    enabled: !!bankSlug,
    queryFn: async () => {
      const { data } = await supabase
        .from("gca_question_banks")
        .select("id, title, topic, description, difficulty, is_pro_only, learning_content, organization_id")
        .eq("slug", bankSlug!)
        .maybeSingle();
      return data as BankMeta | null;
    },
  });

  const canClone =
    !!bank &&
    bank.organization_id === null && // only canonical banks are cloneable
    !!organization?.id &&
    (isAdmin || hasOrgAdminAccess || hasOrgSupervisorAccess);

  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!bank?.id || !organization?.id) throw new Error("Missing context");
      const { data, error } = await (supabase as any).rpc("clone_gca_bank_to_org", {
        _source_bank_id: bank.id,
        _organization_id: organization.id,
        _override_title: null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: async () => {
      toast.success("Test cloned into your organization. Find it in the GCA editor.");
      qc.invalidateQueries({ queryKey: ["gca-banks"] });
      // F-12: audit admin/supervisor paywall bypass for cloning canonical Pro bank
      if (!hasProAccess && organization?.id && bank?.id) {
        try {
          await supabase.from("data_access_logs").insert({
            user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
            organization_id: organization.id,
            table_name: "gca_question_banks",
            record_id: bank.id,
            operation: "admin_paywall_bypass_clone",
            metadata: { bank_slug: bankSlug, reason: "admin_role_bypass" },
          });
        } catch (e) {
          console.warn("Failed to log paywall bypass:", e);
        }
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Clone failed"),
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
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <GraduationCap className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-2xl font-semibold break-words">{bank?.title ?? "Loading…"}</h1>
            {bank && (
              <Badge variant="outline" className="capitalize">{bank.difficulty}</Badge>
            )}
            {bank?.is_pro_only && (
              <Badge variant="secondary">Pro</Badge>
            )}
            {bank?.organization_id && (
              <Badge variant="outline" className="text-xs">Org copy</Badge>
            )}
          </div>
          {canClone && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => cloneMutation.mutate()}
              disabled={cloneMutation.isPending}
              className="gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {cloneMutation.isPending ? "Cloning…" : "Clone to my organization"}
            </Button>
          )}
        </div>

        {bank?.description && (
          <p className="text-sm text-muted-foreground">{bank.description}</p>
        )}

        {bank?.topic === "Measurement Tools" && (
          <GcaToolVideos slugs={getGcaToolSlugs(bankSlug)} />
        )}

        {isDefinitelyFree && bank?.is_pro_only && (
          <Card>
            <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                This test bank requires <strong>GCA Pro</strong>.
              </p>
              <div className="flex gap-2 flex-wrap">
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

        {bank?.learning_content && (
          <Card className="border-primary/20">
            <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Learning Section — read this first
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        learningOpen ? "rotate-180" : ""
                      }`}
                    />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-0">
                  <ReactMarkdown>{bank.learning_content}</ReactMarkdown>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {!isLoading && bankSlug && (
          <GcaTestPlayer
            bankSlug={bankSlug}
            hasProAccess={hasProAccess}
            onUpgrade={handleUpgrade}
            mode="graded"
          />
        )}
      </main>
    </div>
  );
}
