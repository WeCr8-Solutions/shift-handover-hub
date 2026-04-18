import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Stamp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MemberRow {
  user_id: string;
  display_name: string | null;
  role: string;
}

interface Props {
  organizationId: string;
  organizationName: string;
  canEdit: boolean;
}

/**
 * Lets an org admin pick the "Designated OAP Mentor" — the person whose name and
 * title appears on every OAP certificate this organization issues. Required
 * before the issue-certificate edge function will mint a cert.
 *
 * Mentor must be an existing org admin, owner, or supervisor.
 */
export function DesignatedOapMentorCard({ organizationId, organizationName, canEdit }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [orgRes, memberRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("designated_oap_mentor_user_id")
          .eq("id", organizationId)
          .maybeSingle(),
        supabase
          .from("organization_members")
          .select("user_id, role, profiles:user_id(display_name)")
          .eq("organization_id", organizationId)
          .in("role", ["owner", "admin", "supervisor"]),
      ]);

      if (cancelled) return;

      const mentorId = (orgRes.data as any)?.designated_oap_mentor_user_id ?? null;
      setSelected(mentorId);
      setInitial(mentorId);

      const rows: MemberRow[] = ((memberRes.data ?? []) as any[]).map((m) => ({
        user_id: m.user_id,
        display_name: m.profiles?.display_name ?? null,
        role: m.role,
      }));
      setMembers(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const dirty = selected !== initial;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ designated_oap_mentor_user_id: selected })
        .eq("id", organizationId);

      if (error) {
        toast({
          title: "Failed to save designated OAP mentor",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setInitial(selected);
      toast({
        title: "Designated OAP mentor saved",
        description: "Their name will appear on every OAP certificate this organization issues.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stamp className="h-5 w-5" />
          Designated OAP Mentor
        </CardTitle>
        <CardDescription>
          The mentor whose name signs every OAP certificate {organizationName} issues. Pick from your owners, admins,
          or supervisors. <strong>Required</strong> before issuing OAP certificates.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>
              No eligible members found. Promote a teammate to <strong>admin</strong> or{" "}
              <strong>supervisor</strong> first, then return here.
            </span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Mentor</Label>
              <Select
                value={selected ?? ""}
                onValueChange={(v) => setSelected(v || null)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a designated mentor…" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name ?? "Unnamed user"}{" "}
                      <span className="text-muted-foreground text-xs">({m.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The selected member's name appears as the signature on every OAP certificate.
              </p>
            </div>

            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!dirty || saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Mentor
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
