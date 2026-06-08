import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
  Mail,
  Copy,
  Download,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useInviteEmailStatus, type InviteEmailRecord } from "@/hooks/useInviteEmailStatus";
import { useConciergeRefresh } from "@/hooks/useConciergeRefresh";

interface RosterUser {
  name?: string;
  email: string;
  role: string;
  app_role?: string;
  invite_code?: string;
  bucket: "owner" | "supervisor" | "operator";
}

interface Props {
  engagementId: string;
  organizationId: string;
  organizationName?: string;
}

const statusBadge = (rec?: InviteEmailRecord) => {
  if (!rec || rec.status === "not_sent") {
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Mail className="w-3 h-3" /> Not sent
      </Badge>
    );
  }
  if (rec.suppressed) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/40">
        <ShieldAlert className="w-3 h-3" /> Suppressed
      </Badge>
    );
  }
  if (rec.status === "sent") {
    return (
      <Badge className="text-[10px] gap-1 bg-status-ok/15 text-status-ok border-status-ok/30">
        <CheckCircle2 className="w-3 h-3" /> Sent
      </Badge>
    );
  }
  if (rec.status === "pending") {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <Clock className="w-3 h-3" /> Queued
      </Badge>
    );
  }
  if (rec.status === "bounced" || rec.status === "complained") {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/40">
        <XCircle className="w-3 h-3" /> {rec.status}
      </Badge>
    );
  }
  // failed / dlq
  return (
    <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/40">
      <AlertTriangle className="w-3 h-3" /> Failed
    </Badge>
  );
};

export function InvitesRolesBoard({ engagementId, organizationId, organizationName }: Props) {
  const refresh = useConciergeRefresh(engagementId, organizationId);

  const { data: intake, isLoading: loadingIntake } = useQuery({
    queryKey: ["onboarding-users-roles", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_intake_responses")
        .select("payload")
        .eq("engagement_id", engagementId)
        .eq("module_key", "users_roles")
        .maybeSingle();
      if (error) throw error;
      return (data?.payload as any) ?? {};
    },
  });

  const roster: RosterUser[] = useMemo(() => {
    const out: RosterUser[] = [];
    if (intake?.owner?.email) {
      out.push({
        name: intake.owner.name,
        email: intake.owner.email,
        role: intake.owner.role || "owner",
        app_role: intake.owner.app_role,
        invite_code: intake.owner.invite_code,
        bucket: "owner",
      });
    }
    (intake?.supervisors ?? []).forEach((u: any) => {
      if (u?.email)
        out.push({ ...u, role: u.role || "supervisor", bucket: "supervisor" });
    });
    (intake?.operators ?? []).forEach((u: any) => {
      if (u?.email) out.push({ ...u, role: u.role || "operator", bucket: "operator" });
    });
    return out;
  }, [intake]);

  const emails = useMemo(() => roster.map((r) => r.email), [roster]);
  const { data: emailStatus, isLoading: loadingEmails } = useInviteEmailStatus(engagementId, emails);

  // Account status per email
  const { data: accountStatus } = useQuery({
    queryKey: ["concierge-team-status", organizationId, emails.join(",")],
    enabled: emails.length > 0,
    queryFn: async () => {
      const lower = emails.map((e) => e.toLowerCase());
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email, rob_accepted_at")
        .in("email", lower);
      const userIds = (profs ?? []).map((p) => p.user_id).filter(Boolean);
      let memMap = new Map<string, string>();
      if (userIds.length) {
        const { data: mems } = await supabase
          .from("organization_members")
          .select("user_id, role")
          .eq("organization_id", organizationId)
          .in("user_id", userIds);
        memMap = new Map((mems ?? []).map((m: any) => [m.user_id, m.role]));
      }
      const profMap = new Map((profs ?? []).map((p: any) => [p.email.toLowerCase(), p]));
      const out: Record<string, { signedUp: boolean; joined: boolean; acknowledged: boolean; orgRole?: string }> = {};
      for (const e of lower) {
        const p = profMap.get(e);
        out[e] = {
          signedUp: !!p,
          joined: !!(p && memMap.get(p.user_id)),
          acknowledged: !!p?.rob_accepted_at,
          orgRole: p ? memMap.get(p.user_id) : undefined,
        };
      }
      return out;
    },
  });

  const [sendingOne, setSendingOne] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  async function sendInvite(u: RosterUser) {
    setSendingOne(u.email);
    try {
      const inviteUrl = `https://jobline.ai/auth?invite=${encodeURIComponent(u.invite_code ?? "")}`;
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "claim-account",
          recipientEmail: u.email,
          idempotencyKey: `concierge-${u.bucket}-${engagementId}-${u.email.toLowerCase()}-${Date.now()}`,
          templateData: {
            recipientName: u.name ?? u.email.split("@")[0],
            organizationName: organizationName ?? "your shop",
            inviteCode: u.invite_code ?? "",
            inviteUrl,
            role: (u.role ?? "team member").replace(/\b\w/g, (c) => c.toUpperCase()),
            inviterName: "Jobline.ai Concierge",
          },
        },
      });
      if (error) throw error;
      toast.success(`Invite queued for ${u.email}`);
      setTimeout(refresh, 1200);
    } catch (e: any) {
      toast.error("Failed to queue", { description: e?.message });
    } finally {
      setSendingOne(null);
    }
  }

  async function resendFailures() {
    const targets = roster.filter((u) => {
      const rec = emailStatus?.[u.email.toLowerCase()];
      return (
        !rec ||
        rec.status === "not_sent" ||
        rec.status === "failed" ||
        rec.status === "dlq"
      );
    });
    if (targets.length === 0) {
      toast.info("Nothing to resend");
      return;
    }
    setBulkRunning(true);
    let ok = 0;
    for (const u of targets) {
      try {
        await sendInvite(u);
        ok += 1;
      } catch {/* noop */}
    }
    setBulkRunning(false);
    toast.success(`Queued ${ok} of ${targets.length}`);
  }

  function copyShare(u: RosterUser) {
    const url = `https://jobline.ai/auth?invite=${encodeURIComponent(u.invite_code ?? "")}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  function exportCsv() {
    const header = ["name", "email", "role", "app_role", "invite_code", "email_status", "email_at", "account"].join(",");
    const rows = roster.map((u) => {
      const rec = emailStatus?.[u.email.toLowerCase()];
      const acc = accountStatus?.[u.email.toLowerCase()];
      const account =
        acc?.joined && acc?.acknowledged ? "active"
        : acc?.joined ? "joined"
        : acc?.signedUp ? "signed_up"
        : "not_claimed";
      return [u.name ?? "", u.email, u.role, u.app_role ?? "", u.invite_code ?? "", rec?.status ?? "not_sent", rec?.lastEventAt ?? "", account]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invites-roles-${engagementId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loadingIntake) return <Skeleton id="invites-roles-board" className="h-48 w-full" />;

  return (
    <Card id="invites-roles-board">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" /> Invites &amp; Roles ({roster.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Per-member invite, email-delivery, and account status. Resend failed invites or copy share links inline.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1 h-8 text-xs">
              <Download className="w-3 h-3" /> CSV
            </Button>
            <Button size="sm" onClick={resendFailures} disabled={bulkRunning || roster.length === 0} className="gap-1 h-8 text-xs">
              <Send className="w-3 h-3" />
              {bulkRunning ? "Sending…" : "Resend not-sent / failed"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {roster.length === 0 ? (
          <div className="rounded border border-dashed p-4 text-xs text-muted-foreground">
            No team members captured yet — add them in the <strong>Users &amp; Roles</strong> tab or upload a CSV.
          </div>
        ) : (
          <ul className="divide-y -mx-2">
            {roster.map((u) => {
              const rec = emailStatus?.[u.email.toLowerCase()];
              const acc = accountStatus?.[u.email.toLowerCase()];
              const accountBadge =
                acc?.joined && acc?.acknowledged ? (
                  <Badge className="text-[10px] gap-1 bg-status-ok/15 text-status-ok border-status-ok/30">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </Badge>
                ) : acc?.joined ? (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Clock className="w-3 h-3" /> Joined
                  </Badge>
                ) : acc?.signedUp ? (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Clock className="w-3 h-3" /> Signed up
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Clock className="w-3 h-3" /> Not claimed
                  </Badge>
                );
              return (
                <li key={u.email} className="px-2 py-2.5 flex items-start sm:items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{u.name ?? u.email}</span>
                      <Badge variant="outline" className="capitalize text-[10px]">{u.bucket}</Badge>
                      {u.app_role && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">{u.app_role}</Badge>
                      )}
                      {statusBadge(rec)}
                      {accountBadge}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                      <span>{u.email}</span>
                      {u.invite_code && <span>code <code className="font-mono">{u.invite_code}</code></span>}
                      {rec?.lastEventAt && (
                        <span>last: {new Date(rec.lastEventAt).toLocaleString()}</span>
                      )}
                      {rec?.errorMessage && (
                        <span className="text-destructive truncate max-w-[260px]" title={rec.errorMessage}>
                          {rec.errorMessage}
                        </span>
                      )}
                      {rec?.suppressed && rec.suppressedReason && (
                        <span className="text-destructive">suppressed: {rec.suppressedReason}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyShare(u)}
                      disabled={!u.invite_code}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Link
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => sendInvite(u)}
                      disabled={sendingOne === u.email || rec?.suppressed}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {sendingOne === u.email ? "Sending…" : rec && rec.status !== "not_sent" ? "Resend" : "Send"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {loadingEmails && (
          <div className="text-xs text-muted-foreground mt-2">Loading email delivery status…</div>
        )}
      </CardContent>
    </Card>
  );
}
