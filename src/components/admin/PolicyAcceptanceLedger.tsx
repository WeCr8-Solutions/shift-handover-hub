import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, FileText, Users, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type ApprovalState = "draft" | "in_review" | "approved" | "published" | "archived";

interface PolicyVersion {
  id: string;
  policy_type: string;
  version_label: string;
  title: string;
  summary: string | null;
  effective_date: string;
  approval_state: ApprovalState;
  published_at: string | null;
  created_at: string;
}

interface PolicyAcceptance {
  id: string;
  policy_version_id: string;
  user_id: string;
  organization_id: string | null;
  accepted_at: string;
  acceptance_method: string;
}

const STATE_VARIANT: Record<ApprovalState, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  in_review: "secondary",
  approved: "secondary",
  published: "default",
  archived: "destructive",
};

const POLICY_LABEL: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
  billing: "Billing Terms",
  combined: "Combined Agreements",
};

export function PolicyAcceptanceLedger() {
  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["policy-versions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("policy_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PolicyVersion[];
    },
  });

  const { data: acceptances, isLoading: acceptancesLoading } = useQuery({
    queryKey: ["policy-acceptances", selectedVersion?.id],
    enabled: !!selectedVersion,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("policy_acceptances")
        .select("*")
        .eq("policy_version_id", selectedVersion!.id)
        .order("accepted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PolicyAcceptance[];
    },
  });

  // Acceptance count per version
  const { data: acceptanceCounts } = useQuery({
    queryKey: ["policy-acceptance-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("policy_acceptances")
        .select("policy_version_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as { policy_version_id: string }[]) {
        counts[row.policy_version_id] = (counts[row.policy_version_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const handleExportCSV = () => {
    if (!acceptances?.length) return;
    const header = "acceptance_id,version_id,user_id,organization_id,accepted_at,method\n";
    const rows = acceptances
      .map((a) =>
        [a.id, a.policy_version_id, a.user_id, a.organization_id ?? "", a.accepted_at, a.acceptance_method].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `policy-acceptances-${selectedVersion?.version_label ?? "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Acceptance ledger exported");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Policy Acceptance Ledger</h2>
        <p className="text-sm text-muted-foreground">
          Published policy versions and their user acceptance records. Immutable audit trail.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !versions?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No policy versions yet</p>
            <p className="text-sm mt-1">
              Create a policy version in Policy Notices to start tracking acceptance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <Card
              key={v.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedVersion(v)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{v.title}</span>
                    <Badge variant={STATE_VARIANT[v.approval_state]} className="text-xs shrink-0">
                      {v.approval_state}
                    </Badge>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {POLICY_LABEL[v.policy_type] ?? v.policy_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    v{v.version_label} · effective {format(new Date(v.effective_date), "MMM d, yyyy")}
                    {v.published_at && (
                      <> · published {format(new Date(v.published_at), "MMM d, yyyy")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {acceptanceCounts?.[v.id] ?? 0} accepted
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acceptance detail dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={(o) => { if (!o) setSelectedVersion(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Acceptances — {selectedVersion?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              {acceptances?.length ?? 0} total acceptances
            </p>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!acceptances?.length}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
          {acceptancesLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !acceptances?.length ? (
            <div className="py-10 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No acceptances recorded yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Accepted at</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptances.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{a.user_id.slice(0, 8)}…</td>
                      <td className="py-2">
                        <Badge variant="secondary" className="text-xs">{a.acceptance_method}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {format(new Date(a.accepted_at), "MMM d, yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
