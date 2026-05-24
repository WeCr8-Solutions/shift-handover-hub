import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, AlertTriangle, ShieldBan, ShieldCheck, Flag, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AbuseReport {
  id: string;
  reported_by_user_id: string;
  reported_organization_id: string | null;
  report_type: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface RecruiterLimit {
  id: string;
  organization_id: string;
  daily_limit: number;
  weekly_limit: number;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  notes: string | null;
  updated_at: string;
}

const REPORT_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  under_review: "secondary",
  resolved: "default",
  dismissed: "outline",
};

export function TalentGovernance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [resolveTarget, setResolveTarget] = useState<AbuseReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<RecruiterLimit | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["talent-abuse-reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("talent_abuse_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AbuseReport[];
    },
  });

  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ["recruiter-messaging-limits"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("recruiter_messaging_limits")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecruiterLimit[];
    },
  });

  const resolveReport = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "dismissed" }) => {
      const { error } = await (supabase as any)
        .from("talent_abuse_reports")
        .update({
          status,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report updated");
      setResolveTarget(null);
      setResolutionNotes("");
      void qc.invalidateQueries({ queryKey: ["talent-abuse-reports"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleSuspension = useMutation({
    mutationFn: async ({ limitId, suspend }: { limitId: string; suspend: boolean }) => {
      const { error } = await (supabase as any)
        .from("recruiter_messaging_limits")
        .update({
          is_suspended: suspend,
          suspension_reason: suspend ? suspensionReason.trim() || null : null,
          suspended_by: suspend ? user?.id : null,
          suspended_at: suspend ? new Date().toISOString() : null,
        })
        .eq("id", limitId);
      if (error) throw error;
    },
    onSuccess: (_, { suspend }) => {
      toast.success(suspend ? "Recruiter suspended" : "Suspension lifted");
      setSuspendTarget(null);
      setSuspensionReason("");
      void qc.invalidateQueries({ queryKey: ["recruiter-messaging-limits"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCount = (reports ?? []).filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Talent Governance</h2>
          <p className="text-sm text-muted-foreground">
            Candidate consent records, abuse reports, and recruiter messaging controls.
          </p>
        </div>
        {openCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {openCount} open {openCount === 1 ? "report" : "reports"}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="w-4 h-4" />
            Abuse Reports
            {openCount > 0 && (
              <Badge variant="destructive" className="text-xs h-4 px-1 ml-1">{openCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="limits" className="gap-1.5">
            <ShieldBan className="w-4 h-4" />
            Recruiter Limits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Abuse Reports</CardTitle>
              <CardDescription>
                {reportsLoading ? "Loading…" : `${reports?.length ?? 0} total · ${openCount} open`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {reportsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !reports?.length ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No abuse reports</p>
                  <p className="text-sm mt-1">Candidate-submitted reports will appear here.</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="divide-y">
                    {reports.map((r) => (
                      <div key={r.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={REPORT_STATUS_VARIANT[r.status]} className="text-xs">
                            {r.status.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {r.report_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(r.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm">{r.description}</p>
                        {r.status === "open" || r.status === "under_review" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResolveTarget(r)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        ) : (
                          r.resolution_notes && (
                            <p className="text-xs text-muted-foreground italic">{r.resolution_notes}</p>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recruiter Messaging Limits</CardTitle>
              <CardDescription>
                {limitsLoading ? "Loading…" : `${limits?.length ?? 0} orgs · ${(limits ?? []).filter((l) => l.is_suspended).length} suspended`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {limitsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !limits?.length ? (
                <div className="py-12 text-center text-muted-foreground">
                  <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No rate limit records</p>
                  <p className="text-sm mt-1">Recruiter orgs with custom limits appear here.</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="divide-y">
                    {limits.map((l) => (
                      <div key={l.id} className="px-4 py-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {l.is_suspended ? (
                              <Badge variant="destructive" className="text-xs">Suspended</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Active</Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-mono">
                              {l.organization_id.slice(0, 8)}…
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {l.daily_limit}/day · {l.weekly_limit}/week
                          </p>
                          {l.suspension_reason && (
                            <p className="text-xs text-red-600 mt-0.5">{l.suspension_reason}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={l.is_suspended ? "outline" : "destructive"}
                          onClick={() => setSuspendTarget(l)}
                        >
                          {l.is_suspended ? (
                            <><ShieldCheck className="w-3.5 h-3.5 mr-1" />Unsuspend</>
                          ) : (
                            <><ShieldBan className="w-3.5 h-3.5 mr-1" />Suspend</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve report dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) setResolveTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Abuse Report</DialogTitle>
            <DialogDescription>Add optional resolution notes before closing this report.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution notes (optional)…"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setResolveTarget(null)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => resolveReport.mutate({ id: resolveTarget!.id, status: "dismissed" })}
              disabled={resolveReport.isPending}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => resolveReport.mutate({ id: resolveTarget!.id, status: "resolved" })}
              disabled={resolveReport.isPending}
            >
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/unsuspend dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => { if (!o) setSuspendTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendTarget?.is_suspended ? "Lift Suspension" : "Suspend Recruiter"}
            </DialogTitle>
            <DialogDescription>
              {suspendTarget?.is_suspended
                ? "This will restore the recruiter's messaging access."
                : "This will block the org from sending any new recruiter messages."}
            </DialogDescription>
          </DialogHeader>
          {!suspendTarget?.is_suspended && (
            <Textarea
              placeholder="Reason for suspension…"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={2}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button
              variant={suspendTarget?.is_suspended ? "default" : "destructive"}
              onClick={() =>
                toggleSuspension.mutate({
                  limitId: suspendTarget!.id,
                  suspend: !suspendTarget!.is_suspended,
                })
              }
              disabled={toggleSuspension.isPending}
            >
              {suspendTarget?.is_suspended ? "Lift Suspension" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
