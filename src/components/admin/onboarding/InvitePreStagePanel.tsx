/**
 * Concierge-only pre-stage panel.
 * For each unused invite on an org, lets the concierge pin a Team + Default Station
 * that get applied automatically when the invitee redeems the QR/code (via
 * redeem_invite_code → team_members + user_org_preferences).
 *
 * Edits are blocked once uses_count > 0 to avoid drift after redemption.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Props { organizationId: string }

interface InviteRow {
  id: string;
  invite_code: string;
  invited_email: string | null;
  org_role: string;
  app_role: string | null;
  team_id: string | null;
  default_station_id: string | null;
  uses_count: number;
  max_uses: number | null;
  is_active: boolean;
}

const NONE = "__none__";

export function InvitePreStagePanel({ organizationId }: Props) {
  const qc = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const invitesQ = useQuery({
    queryKey: ["concierge-invite-prestage", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("organization_invites")
        .select("id, invite_code, invited_email, org_role, app_role, team_id, default_station_id, uses_count, max_uses, is_active")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InviteRow[];
    },
  });

  const teamsQ = useQuery({
    queryKey: ["org-teams-prestage", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("teams")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
  });

  const stationsQ = useQuery({
    queryKey: ["org-stations-prestage", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stations")
        .select("id, name, station_id, team_id")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string; station_id: string; team_id: string | null }>;
    },
  });

  const teams = teamsQ.data ?? [];
  const stations = stationsQ.data ?? [];

  const updateInvite = useMutation({
    mutationFn: async (input: { id: string; team_id: string | null; default_station_id: string | null }) => {
      const { error } = await (supabase as any)
        .from("organization_invites")
        .update({
          team_id: input.team_id,
          default_station_id: input.default_station_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concierge-invite-prestage", organizationId] });
      toast.success("Pre-stage saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
    onSettled: () => setSavingId(null),
  });

  const rows = invitesQ.data ?? [];
  const pending = useMemo(() => rows.filter((r) => r.uses_count === 0 && r.is_active), [rows]);
  const redeemed = useMemo(() => rows.filter((r) => r.uses_count > 0 || !r.is_active), [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="w-4 h-4" /> Pre-stage invites (Team &amp; Station)
        </CardTitle>
        <CardDescription className="text-xs">
          Pin the Team and Default Station on each unredeemed invite so when the user
          scans the QR, they're dropped straight onto the right team / station — no follow-up cleanup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitesQ.isLoading ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading invites…
          </div>
        ) : pending.length === 0 ? (
          <p className="text-xs text-muted-foreground">No unredeemed invites to pre-stage.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => {
              const stationOptions = stations.filter((s) => !r.team_id || !s.team_id || s.team_id === r.team_id);
              return (
                <div key={r.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{r.invite_code}</code>
                    <span className="text-muted-foreground truncate">{r.invited_email ?? "(any email)"}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{r.org_role}</Badge>
                    {r.app_role && <Badge variant="outline" className="text-[10px]">{r.app_role}</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Team</label>
                      <Select
                        value={r.team_id ?? NONE}
                        onValueChange={(v) => {
                          setSavingId(r.id);
                          updateInvite.mutate({
                            id: r.id,
                            team_id: v === NONE ? null : v,
                            default_station_id: r.default_station_id,
                          });
                        }}
                        disabled={savingId === r.id}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE} className="text-xs">— None —</SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Default station</label>
                      <Select
                        value={r.default_station_id ?? NONE}
                        onValueChange={(v) => {
                          setSavingId(r.id);
                          updateInvite.mutate({
                            id: r.id,
                            team_id: r.team_id,
                            default_station_id: v === NONE ? null : v,
                          });
                        }}
                        disabled={savingId === r.id}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE} className="text-xs">— None —</SelectItem>
                          {stationOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.name} <span className="text-muted-foreground">({s.station_id})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {redeemed.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Redeemed / inactive ({redeemed.length})</summary>
            <ul className="mt-2 space-y-1">
              {redeemed.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <code className="font-mono">{r.invite_code}</code>
                  <span>{r.invited_email}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {r.uses_count}/{r.max_uses ?? "∞"}
                  </Badge>
                </li>
              ))}
            </ul>
          </details>
        )}

        {savingId && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Editing is locked once an invite is redeemed — use Org Members to change a user's team/station after that.
        </p>
      </CardContent>
    </Card>
  );
}
