import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConciergeTeam } from "@/hooks/useConciergeTeam";
import type { Engagement } from "@/hooks/useOnboardingEngagements";

interface Props {
  engagement: Engagement;
  currentUserId: string | null;
}

/**
 * Handoff control surfaced on the Concierge Sales Pack toolbar.
 *
 * Lets the rep see the full concierge team, pick a teammate, write an
 * optional handoff note, and reassign the engagement (`assigned_admin_id`)
 * + append an audit trail to `notes`. The other teammate will see the
 * engagement in their workspace and can continue / finish the contract.
 */
export function ConciergeHandoffPanel({ engagement, currentUserId }: Props) {
  const qc = useQueryClient();
  const { data: team = [], isLoading } = useConciergeTeam();
  const [pickId, setPickId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const teammates = useMemo(
    () => team.filter((t) => t.userId !== currentUserId),
    [team, currentUserId],
  );
  const assignedName = useMemo(
    () => team.find((t) => t.userId === engagement.assigned_admin_id)?.displayName ?? null,
    [team, engagement.assigned_admin_id],
  );

  const doHandoff = async () => {
    if (!pickId) return;
    const target = team.find((t) => t.userId === pickId);
    if (!target) return;
    setBusy(true);
    try {
      const fromName = team.find((t) => t.userId === currentUserId)?.displayName ?? currentUserId ?? "unknown";
      const stamp = new Date().toISOString();
      const note = `[handoff ${stamp}] ${fromName} → ${target.displayName ?? target.email ?? target.userId}${message.trim() ? ` — ${message.trim()}` : ""}`;
      const nextNotes = engagement.notes ? `${engagement.notes}\n${note}` : note;
      const { error } = await supabase
        .from("onboarding_engagements" as any)
        .update({ assigned_admin_id: target.userId, notes: nextNotes })
        .eq("id", engagement.id);
      if (error) throw error;
      toast.success(`Handed off to ${target.displayName ?? target.email}`);
      setMessage("");
      setPickId("");
      qc.invalidateQueries({ queryKey: ["onboarding-engagement", engagement.id] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Handoff failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t pt-2 flex flex-wrap items-end gap-3 text-xs">
      <div className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Users className="w-3.5 h-3.5" /> Concierge team
      </div>
      <div className="text-[11px] text-muted-foreground">
        Currently assigned to:{" "}
        <b>{assignedName ?? (engagement.assigned_admin_id ? engagement.assigned_admin_id.slice(0, 8) : "Unassigned")}</b>
      </div>
      <Label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hand off to teammate</span>
        <Select value={pickId} onValueChange={setPickId} disabled={isLoading || teammates.length === 0}>
          <SelectTrigger className="h-7 text-xs w-60">
            <SelectValue placeholder={isLoading ? "Loading team…" : teammates.length === 0 ? "No other teammates" : "Select teammate"} />
          </SelectTrigger>
          <SelectContent>
            {teammates.map((t) => (
              <SelectItem key={t.userId} value={t.userId}>
                {t.displayName ?? t.email ?? t.userId.slice(0, 8)}
                <span className="ml-2 text-muted-foreground text-[10px]">{t.roles.join(", ")}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Label className="flex flex-col gap-1 flex-1 min-w-[240px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Handoff note (optional)</span>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={1}
          placeholder="e.g. customer still needs to confirm ITAR posture; finish signature page after EOD."
          className="text-xs min-h-[28px] py-1"
        />
      </Label>
      <Button size="sm" onClick={doHandoff} disabled={!pickId || busy} className="gap-1 h-7 text-[11px]">
        <UserPlus2 className="w-3.5 h-3.5" /> {busy ? "Handing off…" : "Hand off"}
      </Button>
    </div>
  );
}
