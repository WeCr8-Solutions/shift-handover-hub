/**
 * FloorMapView — Roadmap item #17 (read-only floor map).
 *
 * Renders all active stations grouped by department / work-center as colored
 * tiles. Tap a tile to drill into the existing station detail panel.
 *
 * Read-only intentionally — no drag-and-drop or coordinate persistence.
 * Coordinates would land in a follow-up `stations.floor_position` migration.
 */
import { useMemo } from "react";
import { useStations } from "@/hooks/useStations";
import { useOrgContext } from "@/contexts/OrgContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, getStatusFromJobState, type StatusLabel } from "./stationStatus";

interface Props {
  onViewStation?: (stationId: string, stationName: string) => void;
}

interface Tile {
  id: string;
  name: string;
  status: StatusLabel;
  workCenter: string | undefined;
  operator: string | null;
  workOrder: string | null;
  groupKey: string;
}

export function FloorMapView({ onViewStation }: Props) {
  const { organization } = useOrgContext();
  const { currentTeam } = useCurrentTeam();
  const { stations, loading } = useStations(currentTeam?.id, organization?.id);

  const groups = useMemo(() => {
    const tiles: Tile[] = stations
      .filter((s) => s.is_active)
      .map((s) => ({
        id: s.id,
        name: s.name,
        status: getStatusFromJobState(s.current_status?.current_job_state),
        workCenter: s.work_center || s.work_center_type || undefined,
        operator: s.current_status?.current_operator_name ?? null,
        workOrder: s.current_status?.current_job_work_order ?? null,
        groupKey: s.work_center_type || s.work_center || "Other",
      }));

    const map = new Map<string, Tile[]>();
    for (const t of tiles) {
      const arr = map.get(t.groupKey) ?? [];
      arr.push(t);
      map.set(t.groupKey, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupKey, items]) => ({
        groupKey,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [stations]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
        No active stations to display.
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="floor-map-view">
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        <span className="text-muted-foreground">Legend:</span>
        {(["running", "setup", "waiting", "idle", "down"] as StatusLabel[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={cn("w-2.5 h-2.5 rounded-full", STATUS_CONFIG[s].bgClass)} />
            <span className="capitalize">{s}</span>
          </span>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.groupKey} aria-label={`Floor area ${g.groupKey}`}>
          <header className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{g.groupKey}</h3>
            <Badge variant="outline" className="text-[10px]">
              {g.items.length} station{g.items.length === 1 ? "" : "s"}
            </Badge>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {g.items.map((t) => {
              const cfg = STATUS_CONFIG[t.status];
              const interactive = !!onViewStation;
              const Tag = interactive ? "button" : "div";
              return (
                <Tag
                  key={t.id}
                  {...(interactive
                    ? { onClick: () => onViewStation?.(t.id, t.name), type: "button" as const }
                    : {})}
                  className={cn(
                    "text-left rounded-lg border p-2.5 transition-colors min-h-[88px] flex flex-col gap-1",
                    "bg-card border-border",
                    interactive && "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                  aria-label={`${t.name} — ${t.status}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{t.name}</span>
                    <span
                      className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.bgClass)}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wide">
                    {t.status}
                  </span>
                  {t.workOrder && (
                    <span className="text-[11px] font-mono truncate text-foreground">
                      {t.workOrder}
                    </span>
                  )}
                  {t.operator && (
                    <span className="text-[10px] text-muted-foreground truncate">{t.operator}</span>
                  )}
                </Tag>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
