import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, Clock, Share2, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface IntakeUser {
  name?: string;
  email?: string;
  role?: string;
  invite_code?: string;
  app_role?: string;
}
interface UsersRolesPayload {
  owner?: IntakeUser;
  supervisors?: IntakeUser[];
  operators?: IntakeUser[];
}

interface Props {
  engagementId: string;
  organizationId: string;
  organizationName?: string;
}

/**
 * Owner-first invite flow:
 *   1) Send claim-account to the owner (always available)
 *   2) Once owner has accepted their seat AND signed in, unlock
 *      "send to supervisors / operators" + QR share link.
 */
export function OwnerInvitePanel({ engagementId, organizationId, organizationName }: Props) {
  const { data: intake, isLoading } = useQuery({
    queryKey: ["onboarding-users-roles", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_intake_responses")
        .select("payload")
        .eq("engagement_id", engagementId)
        .eq("module_key", "users_roles")
        .maybeSingle();
      if (error) throw error;
      return (data?.payload as UsersRolesPayload) ?? {};
    },
  });

  // Owner readiness = is the owner in organization_members + has signed in?
  const { data: ownerStatus, refetch: refetchOwner } = useQuery({
    queryKey: ["concierge-owner-status", organizationId, intake?.owner?.email],
    enabled: !!intake?.owner?.email,
    queryFn: async () => {
      const email = intake!.owner!.email!.toLowerCase();
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, email, full_name, last_sign_in_at")
        .ilike("email", email)
        .maybeSingle();
      if (!prof) return { signedUp: false, signedIn: false, joined: false };
      const { data: mem } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", organizationId)
        .eq("user_id", prof.id)
        .maybeSingle();
      return {
        signedUp: true,
        signedIn: !!prof.last_sign_in_at,
        joined: !!mem,
        role: mem?.role,
        lastSignIn: prof.last_sign_in_at,
      };
    },
  });

  const owner = intake?.owner;
  const team = useMemo(() => {
    const all: IntakeUser[] = [];
    (intake?.supervisors ?? []).forEach((u) => all.push({ ...u, role: u.role || "supervisor" }));
    (intake?.operators ?? []).forEach((u) => all.push({ ...u, role: u.role || "operator" }));
    return all.filter((u) => u.email);
  }, [intake]);

  const ownerReady = !!ownerStatus?.joined && !!ownerStatus?.signedIn;

  const shareUrl = `https://jobline.ai/auth?invite=${encodeURIComponent(owner?.invite_code ?? "")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  const [sendingOwner, setSendingOwner] = useState(false);
  const [sendingTeam, setSendingTeam] = useState(false);

  const sendOwner = async () => {
    if (!owner?.email) return;
    setSendingOwner(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "claim-account",
          recipientEmail: owner.email,
          idempotencyKey: `concierge-owner-${engagementId}-${owner.email.toLowerCase()}`,
          templateData: {
            recipientName: owner.name ?? owner.email.split("@")[0],
            organizationName: organizationName ?? "your shop",
            inviteCode: owner.invite_code ?? "",
            inviteUrl: shareUrl,
            role: "Org Owner",
            inviterName: "Jobline.ai Concierge",
          },
        },
      });
      if (error) throw error;
      toast.success(`Claim-account email queued for ${owner.email}`);
    } catch (e: any) {
      toast.error("Failed to queue owner email", { description: e?.message });
    } finally {
      setSendingOwner(false);
      refetchOwner();
    }
  };

  const sendTeam = async () => {
    if (!ownerReady) {
      toast.error("Owner must sign in first", {
        description: "Subsequent invites unlock once the owner has accepted their seat.",
      });
      return;
    }
    setSendingTeam(true);
    let queued = 0;
    let failed = 0;
    for (const u of team) {
      try {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "claim-account",
            recipientEmail: u.email!,
            idempotencyKey: `concierge-team-${engagementId}-${u.email!.toLowerCase()}`,
            templateData: {
              recipientName: u.name ?? u.email!.split("@")[0],
              organizationName: organizationName ?? "your shop",
              inviteCode: u.invite_code ?? "",
              inviteUrl: `https://jobline.ai/auth?invite=${encodeURIComponent(u.invite_code ?? "")}`,
              role: (u.role ?? "team member").replace(/\b\w/g, (c) => c.toUpperCase()),
              inviterName: `${owner?.name ?? "Your owner"} (via Jobline.ai concierge)`,
            },
          },
        });
        if (error) throw error;
        queued += 1;
      } catch {
        failed += 1;
      }
    }
    setSendingTeam(false);
    if (queued) toast.success(`${queued} team invite${queued === 1 ? "" : "s"} queued`);
    if (failed) toast.error(`${failed} failed to queue`);
  };

  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied");
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!owner?.email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" /> Owner invite
          </CardTitle>
          <CardDescription>
            No owner email captured yet — complete the Users &amp; Roles intake module above first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4" /> Owner-first invite chain
        </CardTitle>
        <CardDescription>
          Send the owner their claim-account email. Team invites and the QR/share link unlock
          once the owner has signed in and acknowledged the account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Owner row */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{owner.name ?? owner.email}</span>
                <Badge variant="outline" className="text-[10px]">Owner</Badge>
                {ownerReady ? (
                  <Badge className="gap-1 bg-status-ok/15 text-status-ok border-status-ok/30 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Signed in
                  </Badge>
                ) : ownerStatus?.signedUp ? (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Clock className="w-3 h-3" /> Account created, awaiting sign-in
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Clock className="w-3 h-3" /> Not yet claimed
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{owner.email}</div>
              {owner.invite_code && (
                <div className="text-xs text-muted-foreground">
                  Invite code: <code className="font-mono">{owner.invite_code}</code>
                </div>
              )}
            </div>
            <Button onClick={sendOwner} disabled={sendingOwner} className="gap-2">
              <Send className="w-4 h-4" />
              {sendingOwner ? "Queuing…" : "Send claim-account to owner"}
            </Button>
          </div>
        </div>

        {/* Team unlock */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                Team invites
                {ownerReady ? (
                  <Badge className="gap-1 bg-status-ok/15 text-status-ok border-status-ok/30 text-[10px]">Unlocked</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Locked until owner signs in</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {team.length} recipient{team.length === 1 ? "" : "s"}:{" "}
                {team.map((u) => u.email).join(", ") || "none yet"}
              </div>
            </div>
            <Button
              onClick={sendTeam}
              disabled={!ownerReady || sendingTeam || team.length === 0}
              variant={ownerReady ? "default" : "outline"}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendingTeam ? "Queuing…" : `Send to all team (${team.length})`}
            </Button>
          </div>
        </div>

        {/* QR + share */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="font-medium flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Owner share link &amp; QR
                {!ownerReady && (
                  <Badge variant="outline" className="text-[10px]">Active after owner sign-in</Badge>
                )}
              </div>
              <Label className="text-xs">Share URL</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyShare}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Owner can broadcast this once signed in. Until then, encourage them to use the
                email link from their inbox.
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <img
                src={qrUrl}
                alt="QR code for owner claim-account link"
                width={120}
                height={120}
                className="rounded border bg-card"
                style={{ opacity: ownerReady ? 1 : 0.5 }}
              />
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Scan to claim
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
