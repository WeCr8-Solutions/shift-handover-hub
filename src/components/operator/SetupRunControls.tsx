/**
 * SetupRunControls — Roadmap item #19 (Operator station setup/run two-button time split).
 *
 * Lets operators stamp explicit Setup-start / Run-start transitions on the
 * active work order. Persists wall-clock timestamps + accumulated minutes on
 * `queue_items`, and mirrors the current phase into `current_station_status`
 * so the floor map and analytics view stay in sync without a separate write.
 *
 * Non-destructive — does not block the existing single-button Start flow.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Play, Square, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Phase = "setup" | "run" | "idle";

interface Props {
  queueItemId: string;
  stationId: string;
  currentPhase: Phase | null;
  setupStartedAt: string | null;
  runStartedAt: string | null;
  setupActualMinutes: number | null;
  runActualMinutes: number | null;
  setupPlannedMinutes: number | null;
  onChanged?: () => void;
}

function minutesBetween(from: string | null, to: Date) {
  if (!from) return 0;
  return Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 60000));
}

export function SetupRunControls({
  queueItemId,
  stationId,
  currentPhase,
  setupStartedAt,
  runStartedAt,
  setupActualMinutes,
  runActualMinutes,
  setupPlannedMinutes,
  onChanged,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  // Re-render every 30s so the live counter updates without a query
  useEffect(() => {
    if (currentPhase !== "setup" && currentPhase !== "run") return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [currentPhase]);

  const liveSetupMinutes = useMemo(() => {
    const base = setupActualMinutes ?? 0;
    if (currentPhase === "setup" && setupStartedAt) {
      return base + minutesBetween(setupStartedAt, new Date());
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupActualMinutes, currentPhase, setupStartedAt, tick]);

  const liveRunMinutes = useMemo(() => {
    const base = runActualMinutes ?? 0;
    if (currentPhase === "run" && runStartedAt) {
      return base + minutesBetween(runStartedAt, new Date());
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runActualMinutes, currentPhase, runStartedAt, tick]);

  const setPhase = async (next: Phase) => {
    if (busy || next === currentPhase) return;
    setBusy(true);
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { current_phase: next };

    // Close the outgoing phase, then open the incoming one.
    if (currentPhase === "setup" && setupStartedAt) {
      update.setup_ended_at = now;
      update.setup_actual_minutes = (setupActualMinutes ?? 0) + minutesBetween(setupStartedAt, new Date());
    }
    if (currentPhase === "run" && runStartedAt) {
      update.run_ended_at = now;
      update.run_actual_minutes = (runActualMinutes ?? 0) + minutesBetween(runStartedAt, new Date());
    }
    if (next === "setup") {
      update.setup_started_at = now;
      update.setup_ended_at = null;
    }
    if (next === "run") {
      update.run_started_at = now;
      update.run_ended_at = null;
    }

    try {
      const { error } = await supabase.from("queue_items").update(update).eq("id", queueItemId);
      if (error) throw error;

      // Mirror to station status so the floor map reflects phase immediately.
      const jobState =
        next === "setup" ? "Setting Up" : next === "run" ? "Part Running" : "Idle";
      await supabase
        .from("current_station_status")
        .update({ current_job_state: jobState })
        .eq("station_id", stationId);

      toast.success(`Phase: ${next === "idle" ? "stopped" : next}`);
      onChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update phase";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const variance =
    setupPlannedMinutes && liveSetupMinutes > 0
      ? Math.round(((liveSetupMinutes - setupPlannedMinutes) / setupPlannedMinutes) * 100)
      : null;

  return (
    <div
      className="rounded-md border border-border bg-card/40 p-2 space-y-2"
      data-testid="setup-run-controls"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Phase tracking
        </span>
        {currentPhase && currentPhase !== "idle" && (
          <Badge variant="outline" className="text-[10px] uppercase">
            {currentPhase}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Button
          size="sm"
          variant={currentPhase === "setup" ? "default" : "outline"}
          className="gap-1 text-xs"
          onClick={() => setPhase("setup")}
          disabled={busy}
          aria-pressed={currentPhase === "setup"}
        >
          <Wrench className="w-3 h-3" /> Setup
        </Button>
        <Button
          size="sm"
          variant={currentPhase === "run" ? "default" : "outline"}
          className="gap-1 text-xs"
          onClick={() => setPhase("run")}
          disabled={busy}
          aria-pressed={currentPhase === "run"}
        >
          <Play className="w-3 h-3" /> Run
        </Button>
        <Button
          size="sm"
          variant={currentPhase === "idle" || !currentPhase ? "secondary" : "outline"}
          className="gap-1 text-xs"
          onClick={() => setPhase("idle")}
          disabled={busy || !currentPhase}
        >
          <Square className="w-3 h-3" /> Stop
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="rounded bg-muted/40 px-2 py-1">
          <span className="text-muted-foreground">Setup</span>{" "}
          <span className="font-mono font-medium">{liveSetupMinutes}m</span>
          {setupPlannedMinutes ? (
            <span className="text-muted-foreground"> / {setupPlannedMinutes}m</span>
          ) : null}
          {variance !== null && (
            <span
              className={cn(
                "ml-1 font-medium",
                variance > 0 ? "text-destructive" : "text-[hsl(var(--success))]",
              )}
            >
              ({variance > 0 ? "+" : ""}
              {variance}%)
            </span>
          )}
        </div>
        <div className="rounded bg-muted/40 px-2 py-1">
          <span className="text-muted-foreground">Run</span>{" "}
          <span className="font-mono font-medium">{liveRunMinutes}m</span>
        </div>
      </div>
    </div>
  );
}
