/**
 * Concierge-only "Add existing Jobline user" panel.
 *
 * Use when the operator/supervisor already has a Jobline account and you just
 * need to drop them into this org with the right role + team + default station,
 * skipping the QR claim flow entirely.
 *
 * Two RPCs:
 *  1. concierge_lookup_user_by_email — resolves the account (or returns no_account)
 *  2. concierge_attach_existing_user  — adds to organization_members + burns matching invite
 *  3. concierge_finalize_membership   — sets team + default station + app role
 */
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props { engagementId: string; organizationId: string }

const NONE = "__none__";
type Bucket = "owner" | "supervisor" | "operator";
type LookupResult = {
  exists_account: boolean;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  is_member: boolean | null;
  org_role: string | null;
};

export function AddExistingUserPanel({ engagementId, organizationId }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [bucket, setBucket] = useState<Bucket>("operator");
  const [appRole, setAppRole] = useState<string>("operator");
  const [teamId, setTeamId] = useState<string>(NONE);
  const [stationId, setStationId] = useState<string>(NONE);
  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const teamsQ = useQuery({
    queryKey: ["org-teams-add-existing", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("teams").select("id, name")
        .eq("organization_id", organizationId).order("name");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
  });
  const stationsQ = useQuery({
    queryKey: ["org-stations-add-existing", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stations").select("id, name, station_id, team_id")
        .eq("organization_id", organizationId).order("name");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string; station_id: string; team_id: string | null }>;
    },
  });

  const lookupM = useMutation({
    mutationFn: async (e: string): Promise<LookupResult> => {
      const { data, error } = await (supabase as any).rpc("concierge_lookup_user_by_email", {
        _email: e.trim(), _organization_id: organizationId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? { exists_account: false }) as LookupResult;
    },
    onSuccess: (res) => {
      setLookup(res);
      if (!res?.exists_account) {
        toast.info("No Jobline account for that email — send them a QR invite instead.");
      } else if (res.is_member) {
        toast.info(`${res.email} is already a member (${res.org_role}). You can still update their team/station below.`);
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Lookup failed"),
  });

  const addM = useMutation({
    mutationFn: async () => {
      if (!lookup?.user_id) throw new Error("Run lookup first");
      // 1. Attach (idempotent — handles already-member)
      if (!lookup.is_member) {
        const { error } = await (supabase as any).rpc("concierge_attach_existing_user", {
          _engagement_id: engagementId,
          _bucket: bucket,
          _email: email.trim(),
          _app_role: appRole || null,
          _replaces_email: null,
        });
        if (error) throw error;
      }
      // 2. Finalize team + station (always)
      const { error: ferr } = await (supabase as any).rpc("concierge_finalize_membership", {
        _org_id: organizationId,
        _user_id: lookup.user_id,
        _team_id: teamId === NONE ? null : teamId,
        _default_station_id: stationId === NONE ? null : stationId,
        _app_role: appRole || null,
      });
      if (ferr) throw ferr;
    },
    onSuccess: () => {
      toast.success("User added and finalized");
      qc.invalidateQueries({ queryKey: ["concierge-org-members", organizationId] });
      qc.invalidateQueries({ queryKey: ["onboarding-users-roles", engagementId] });
      qc.invalidateQueries({ queryKey: ["concierge-team-status", organizationId] });
      // Reset
      setEmail(""); setLookup(null); setTeamId(NONE); setStationId(NONE);
    },
    onError: (e: any) => toast.error(e?.message ?? "Add failed"),
  });

  const stationOptions = (stationsQ.data ?? []).filter(
    (s) => teamId === NONE || !s.team_id || s.team_id === teamId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add existing Jobline user
        </CardTitle>
        <CardDescription className="text-xs">
          Skip the QR for users who already have a Jobline account. Look up by email,
          then pick role + team + default station. Membership, team, and station are wired up in one click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLookup(null); }}
            className="h-8 text-xs flex-1 min-w-[200px]"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => email && lookupM.mutate(email)}
            disabled={!email || lookupM.isPending}
            className="h-8 text-xs gap-1"
          >
            {lookupM.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Look up
          </Button>
        </div>

        {lookup && (
          <div className={`rounded-md border p-2 text-xs flex items-start gap-2 ${
            lookup.exists_account ? "border-status-ok/40 bg-status-ok/5" : "border-amber-500/40 bg-amber-500/5"
          }`}>
            {lookup.exists_account ? (
              <CheckCircle2 className="w-4 h-4 text-status-ok shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              {lookup.exists_account ? (
                <>
                  <div className="font-medium truncate">{lookup.full_name || lookup.email}</div>
                  <div className="text-muted-foreground truncate">{lookup.email}</div>
                  {lookup.is_member && (
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                      Already a {lookup.org_role}
                    </Badge>
                  )}
                </>
              ) : (
                <span>No account on Jobline.ai with this email. Send a QR invite instead.</span>
              )}
            </div>
          </div>
        )}

        {lookup?.exists_account && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Role bucket</label>
              <Select value={bucket} onValueChange={(v) => setBucket(v as Bucket)} disabled={!!lookup.is_member}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner" className="text-xs">Owner</SelectItem>
                  <SelectItem value="supervisor" className="text-xs">Supervisor</SelectItem>
                  <SelectItem value="operator" className="text-xs">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">App role</label>
              <Select value={appRole} onValueChange={setAppRole}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="text-xs">admin</SelectItem>
                  <SelectItem value="supervisor" className="text-xs">supervisor</SelectItem>
                  <SelectItem value="operator" className="text-xs">operator</SelectItem>
                  <SelectItem value="viewer" className="text-xs">viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Team</label>
              <Select value={teamId} onValueChange={(v) => { setTeamId(v); setStationId(NONE); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} className="text-xs">— None —</SelectItem>
                  {(teamsQ.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Default station</label>
              <Select value={stationId} onValueChange={setStationId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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

            <div className="sm:col-span-2">
              <Button
                size="sm"
                onClick={() => addM.mutate()}
                disabled={addM.isPending}
                className="w-full h-9 text-xs gap-1"
              >
                {addM.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                {lookup.is_member ? "Update team & station" : "Add to organization"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
