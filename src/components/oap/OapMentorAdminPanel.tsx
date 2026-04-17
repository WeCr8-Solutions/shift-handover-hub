import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOapMentors } from "@/hooks/useOapMentors";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useOrganization } from "@/hooks/useOrganization";
import { ShieldCheck, UserPlus, Power } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Org admin tool to designate which org members can act as OAP mentors
 * (sign off walkthrough check-offs). Backed by `oap_designated_mentors`.
 */
export function OapMentorAdminPanel() {
  const { organization } = useOrganization();
  const { mentors, isLoading, designate, setActive } = useOapMentors();
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const [selected, setSelected] = useState<string>("");
  const [notes, setNotes] = useState("");

  const memberOptions = (members ?? []).map((m: any) => ({
    user_id: m.user_id,
    name: m.display_name || m.email || m.user_id.slice(0, 8),
  }));

  const handleAdd = () => {
    if (!selected) return;
    const m = memberOptions.find((x) => x.user_id === selected);
    designate.mutate(
      { user_id: selected, user_name: m?.name ?? null, notes: notes || null },
      {
        onSuccess: () => {
          setSelected("");
          setNotes("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="w-4 h-4" />
          OAP Designated Mentors
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mentors can sign off operator walkthrough check-offs. Org admins and
          supervisors can always sign off; designating an additional mentor lets
          a senior operator do it too.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
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
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Signed off Mill cell"
            />
          </div>
          <Button onClick={handleAdd} disabled={!selected || designate.isPending}>
            <UserPlus className="w-4 h-4 mr-1" /> Designate
          </Button>
        </div>

        <div className="border rounded-md divide-y">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && mentors.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No designated mentors yet.</div>
          )}
          {mentors.map((m) => (
            <div key={m.id} className="p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{m.user_name ?? m.user_id.slice(0, 8)}</div>
                {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
                <div className="text-xs text-muted-foreground">
                  Since {new Date(m.designated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.is_active ? "default" : "secondary"}>
                  {m.is_active ? "Active" : "Revoked"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActive.mutate({ id: m.id, is_active: !m.is_active })}
                >
                  <Power className="w-3.5 h-3.5 mr-1" />
                  {m.is_active ? "Revoke" : "Re-activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
