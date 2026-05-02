import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCertifyingMentors, type MentorProgram } from "@/hooks/useCertifyingMentors";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useOrganization } from "@/hooks/useOrganization";
import { ShieldCheck, UserPlus, Power, AlertTriangle, Clock, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Org admin tool to designate which org members can act as JobLine certifying
 * mentors (sign off OAP walkthroughs and/or GCA certificates).
 *
 * Workflow:
 *   1. Org admin nominates a member here (creates a `pending` row).
 *   2. JobLine.ai platform admin reviews & approves the row in /admin.
 *   3. Once approved AND the org has a paid subscription, the mentor can sign
 *      real certificates via the cert checkout dialog.
 *
 * Backed by `certifying_mentors` (was `oap_designated_mentors`).
 */
export function OapMentorAdminPanel() {
  const { organization } = useOrganization();
  const { mentors, isLoading, designate, setActive } = useCertifyingMentors({ scope: "org" });
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const [selected, setSelected] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [programs, setPrograms] = useState<MentorProgram[]>(["OAP"]);

  const isPaidOrg = (organization?.subscription_tier ?? "free") !== "free";

  const memberOptions = (members ?? []).map((m: any) => ({
    user_id: m.user_id,
    name: m.display_name || m.email || m.user_id.slice(0, 8),
  }));

  const toggleProgram = (p: MentorProgram, checked: boolean) => {
    setPrograms((prev) => {
      const next = new Set(prev);
      if (checked) next.add(p);
      else next.delete(p);
      // never empty
      if (next.size === 0) next.add("OAP");
      return Array.from(next) as MentorProgram[];
    });
  };

  const handleAdd = () => {
    if (!selected) return;
    const m = memberOptions.find((x) => x.user_id === selected);
    designate.mutate(
      {
        user_id: selected,
        user_name: m?.name ?? null,
        title: title || null,
        programs,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setSelected("");
          setNotes("");
          setTitle("");
          setPrograms(["OAP"]);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="w-4 h-4" />
          Certifying Mentors
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mentors you nominate here can sign GCA and/or OAP certificates for your
          team — once they are approved by JobLine.ai. Org admins/supervisors no
          longer auto-certify; every certificate must carry an approved mentor's
          signature.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPaidOrg && (
          <div
            role="alert"
            className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-medium">Paid employer subscription required</div>
              <div className="text-muted-foreground">
                You can nominate mentors on any tier, but they cannot sign real
                certificates until your organization is on a paid plan. Self-pay
                learners use JobLine.ai's platform mentors instead.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Member</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Pick an org member" />
              </SelectTrigger>
              <SelectContent>
                {memberOptions.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lead Machinist"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Programs they certify</Label>
            <div className="flex gap-4">
              {(["OAP", "GCA"] as MentorProgram[]).map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={programs.includes(p)}
                    onCheckedChange={(c) => toggleProgram(p, !!c)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Signs off Mill cell"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleAdd} disabled={!selected || designate.isPending}>
              <UserPlus className="w-4 h-4 mr-1" /> Nominate mentor
            </Button>
          </div>
        </div>

        <div className="border rounded-md divide-y">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && mentors.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No designated mentors yet.</div>
          )}
          {mentors.map((m) => (
            <div key={m.id} className="p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-medium truncate">
                  {m.user_name ?? m.user_id.slice(0, 8)}
                  {m.title && (
                    <span className="ml-2 text-xs text-muted-foreground">— {m.title}</span>
                  )}
                </div>
                {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>Since {new Date(m.designated_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>Programs: {(m.programs ?? []).join(", ") || "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.approval_status === "approved" ? (
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <Check className="w-3 h-3" /> Approved
                  </Badge>
                ) : m.approval_status === "revoked" ? (
                  <Badge variant="destructive">Revoked</Badge>
                ) : (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3" /> Pending JobLine review
                  </Badge>
                )}
                <Badge variant={m.is_active ? "default" : "secondary"}>
                  {m.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActive.mutate({ id: m.id, is_active: !m.is_active })}
                >
                  <Power className="w-3.5 h-3.5 mr-1" />
                  {m.is_active ? "Disable" : "Re-enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
