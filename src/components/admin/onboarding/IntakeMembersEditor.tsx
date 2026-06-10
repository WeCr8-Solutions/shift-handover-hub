import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Save, UserPlus, Crown, Shield, Hammer, Search, Link2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";


interface Member {
  name?: string;
  email?: string;
  role?: string;
  app_role?: string;
  invite_code?: string;
}
interface Payload {
  owner?: Member;
  supervisors?: Member[];
  operators?: Member[];
}

const APP_ROLES = ["operator", "programming", "setup", "inspector", "supervisor", "admin"] as const;

function genInviteCode(orgSlug: string | undefined, role: "OWNER" | "SUP" | "OP", name?: string) {
  const initials = (name ?? "??")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const prefix = (orgSlug ?? "ORG").split("-")[0].slice(0, 6).toUpperCase();
  const rand = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${role}-${initials || "XX"}${rand}`;
}

export function IntakeMembersEditor({
  engagementId,
  organizationId,
  organizationSlug,
}: {
  engagementId: string;
  organizationId: string;
  organizationSlug?: string;
}) {
  const qc = useQueryClient();
  const { data: initial, isLoading } = useQuery({
    queryKey: ["intake-users-roles", engagementId],
    queryFn: async (): Promise<Payload> => {
      const { data, error } = await supabase
        .from("onboarding_intake_responses")
        .select("payload")
        .eq("engagement_id", engagementId)
        .eq("module_key", "users_roles")
        .maybeSingle();
      if (error) throw error;
      return (data?.payload as Payload) ?? {};
    },
  });

  const [owner, setOwner] = useState<Member>({});
  const [supervisors, setSupervisors] = useState<Member[]>([]);
  const [operators, setOperators] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setOwner(initial.owner ?? {});
      setSupervisors(initial.supervisors ?? []);
      setOperators(initial.operators ?? []);
    }
  }, [initial]);

  const addRow = (kind: "sup" | "op") => {
    const blank: Member = { name: "", email: "", app_role: kind === "sup" ? "supervisor" : "operator" };
    if (kind === "sup") setSupervisors((rs) => [...rs, blank]);
    else setOperators((rs) => [...rs, blank]);
  };

  const updateRow = (kind: "sup" | "op", idx: number, patch: Partial<Member>) => {
    const setter = kind === "sup" ? setSupervisors : setOperators;
    setter((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (kind: "sup" | "op", idx: number) => {
    const setter = kind === "sup" ? setSupervisors : setOperators;
    setter((rs) => rs.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!owner.email) {
      toast.error("Owner email is required");
      return;
    }
    setSaving(true);
    try {
      const norm = (m: Member, role: "OWNER" | "SUP" | "OP", roleLabel: string): Member => ({
        name: m.name?.trim() || undefined,
        email: m.email?.trim().toLowerCase() || undefined,
        role: roleLabel,
        app_role: m.app_role || roleLabel,
        invite_code: m.invite_code?.trim() || genInviteCode(organizationSlug, role, m.name),
      });
      const payload: Payload = {
        owner: norm(owner, "OWNER", "admin"),
        supervisors: supervisors
          .filter((s) => s.email?.trim())
          .map((s) => norm(s, "SUP", "supervisor")),
        operators: operators
          .filter((o) => o.email?.trim())
          .map((o) => norm(o, "OP", "operator")),
      };

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;

      const { error } = await supabase
        .from("onboarding_intake_responses")
        .upsert(
          {
            engagement_id: engagementId,
            organization_id: organizationId,
            module_key: "users_roles",
            payload: payload as any,
            submitted_by: uid,
          },
          { onConflict: "engagement_id,module_key" },
        );
      if (error) throw error;
      toast.success("Members saved");
      qc.invalidateQueries({ queryKey: ["intake-users-roles", engagementId] });
      qc.invalidateQueries({ queryKey: ["onboarding-users-roles", engagementId] });
      qc.invalidateQueries({ queryKey: ["concierge-owner-status"] });
      qc.invalidateQueries({ queryKey: ["concierge-team-status"] });
    } catch (e: any) {
      toast.error("Failed to save", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Members &amp; roles
        </CardTitle>
        <CardDescription>
          Add the owner and team members one-by-one. This feeds the owner-first invite flow below. Bulk CSV upload is still available as an alternative.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner */}
        <section className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm">Owner</h3>
            <Badge variant="outline" className="text-[10px]">required</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Full name</Label>
              <Input value={owner.name ?? ""} onChange={(e) => setOwner({ ...owner, name: e.target.value })} placeholder="Brandon Aymar" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={owner.email ?? ""} onChange={(e) => setOwner({ ...owner, email: e.target.value })} placeholder="owner@shop.com" />
            </div>
            <div>
              <Label className="text-xs">Invite code (auto if blank)</Label>
              <Input value={owner.invite_code ?? ""} onChange={(e) => setOwner({ ...owner, invite_code: e.target.value })} placeholder="AYMAR-OWNER-BA01" />
            </div>
          </div>
        </section>

        {/* Supervisors */}
        <section className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Supervisors ({supervisors.length})</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => addRow("sup")} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Add supervisor
            </Button>
          </div>
          {supervisors.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No supervisors yet.</p>
          ) : (
            <ul className="space-y-2">
              {supervisors.map((s, i) => (
                <MemberRow
                  key={i}
                  member={s}
                  onChange={(p) => updateRow("sup", i, p)}
                  onRemove={() => removeRow("sup", i)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Operators */}
        <section className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Operators / Programmers ({operators.length})</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => addRow("op")} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Add operator
            </Button>
          </div>
          {operators.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No operators yet.</p>
          ) : (
            <ul className="space-y-2">
              {operators.map((o, i) => (
                <MemberRow
                  key={i}
                  member={o}
                  onChange={(p) => updateRow("op", i, p)}
                  onRemove={() => removeRow("op", i)}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-center justify-end">
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save members"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRow({
  member,
  onChange,
  onRemove,
}: {
  member: Member;
  onChange: (patch: Partial<Member>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_140px_auto] gap-2 items-end rounded-md border p-2.5">
      <div>
        <Label className="text-[11px] text-muted-foreground">Name</Label>
        <Input value={member.name ?? ""} onChange={(e) => onChange({ name: e.target.value })} placeholder="Jane Doe" />
      </div>
      <div>
        <Label className="text-[11px] text-muted-foreground">Email</Label>
        <Input type="email" value={member.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} placeholder="jane@shop.com" />
      </div>
      <div>
        <Label className="text-[11px] text-muted-foreground">App role</Label>
        <Select value={member.app_role ?? "operator"} onValueChange={(v) => onChange({ app_role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {APP_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[11px] text-muted-foreground">Invite code</Label>
        <Input value={member.invite_code ?? ""} onChange={(e) => onChange({ invite_code: e.target.value })} placeholder="auto" />
      </div>
      <Button size="icon" variant="ghost" onClick={onRemove} className="text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}
