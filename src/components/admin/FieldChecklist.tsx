/**
 * FieldChecklist.tsx
 *
 * Mobile-first field checklist for the San Diego County flyer drop.
 * Shows zones as accordions; each zone lists its stops with a check-off button.
 * Tapping a stop opens a quick "Log Visit" sheet (medium, count, notes).
 *
 * Access: admin / developer / flyer_worker roles only.
 * Props:
 *   campaignId    — UUID of the flyer_campaigns row
 *   dbZones       — flyer_zones rows (to get zone IDs)
 *   assignedZones — optional array of zone numbers to scope display (helper mode)
 *   assignmentId  — optional UUID of flyer_zone_assignments row
 *   currentUserId — auth.uid() of the signed-in user
 *   displayName   — name to stamp on visits
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ZONE_STOPS, getStopsForZone, DropStop } from "./flyerRouteData";
import { FLYER_ZONES } from "./flyerZoneData";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MapPin, Star, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbZone {
  id: string;
  zone_number: number;
  zone_name: string;
  city: string;
  status: string;
}

interface Medium {
  id: string;
  name: string;
  sort_order: number;
}

interface StopVisit {
  id: string;
  stop_key: string;
  zone_number: number;
  medium_name: string | null;
  flyer_count: number;
  visited_by_name: string | null;
  visited_at: string;
  notes: string | null;
}

interface FieldChecklistProps {
  campaignId: string;
  dbZones: DbZone[];
  assignedZones?: number[];   // undefined = all zones (admin view)
  assignmentId?: string;
  currentUserId: string;
  displayName: string;
}

// ─── Zone progress pill ───────────────────────────────────────────────────────

function ZoneProgress({
  zoneNumber,
  visits,
}: {
  zoneNumber: number;
  visits: StopVisit[];
}) {
  const stops = getStopsForZone(zoneNumber).filter(
    s => !(zoneNumber === 14 && s.key === "z14_regional_note"),
  );
  const visited = new Set(
    visits.filter(v => v.zone_number === zoneNumber).map(v => v.stop_key),
  );
  const done = stops.filter(s => visited.has(s.key)).length;
  const total = stops.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const color =
    pct === 100 ? "bg-green-500" : pct > 0 ? "bg-blue-500" : "bg-muted";

  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <span
          className={cn("block h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}

// ─── Stop row ─────────────────────────────────────────────────────────────────

function StopRow({
  stop,
  visit,
  onTap,
}: {
  stop: DropStop;
  visit: StopVisit | undefined;
  onTap: (stop: DropStop) => void;
}) {
  return (
    <button
      onClick={() => onTap(stop)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 text-left",
        "active:bg-muted/60 transition-colors",
        visit ? "bg-green-50/50 dark:bg-green-950/20" : "bg-background",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {visit ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "font-medium text-sm",
              visit ? "text-green-700 dark:text-green-400" : "text-foreground",
            )}
          >
            {stop.name}
          </span>
          {stop.isPriority && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
          {stop.isFirearms && (
            <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />
          )}
          {stop.isAerospace && (
            <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          )}
        </span>
        <span className="block text-xs text-muted-foreground truncate">
          {stop.address}
        </span>
        {visit && (
          <span className="block text-xs text-green-600 dark:text-green-400 mt-0.5">
            {visit.flyer_count} flyer{visit.flyer_count !== 1 ? "s" : ""} ·{" "}
            {visit.medium_name ?? "—"} ·{" "}
            {new Date(visit.visited_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {stop.notes && !visit && (
          <span className="block text-xs text-muted-foreground mt-0.5 italic">
            {stop.notes}
          </span>
        )}
      </span>
    </button>
  );
}

// ─── Log Visit sheet ──────────────────────────────────────────────────────────

interface LogSheetProps {
  stop: DropStop | null;
  zoneId: string;
  zoneNumber: number;
  campaignId: string;
  existingVisit: StopVisit | undefined;
  mediums: Medium[];
  assignmentId?: string;
  currentUserId: string;
  displayName: string;
  onSaved: () => void;
  onClose: () => void;
}

function LogSheet({
  stop,
  zoneId,
  zoneNumber,
  campaignId,
  existingVisit,
  mediums,
  assignmentId,
  currentUserId,
  displayName,
  onSaved,
  onClose,
}: LogSheetProps) {
  const [mediumId, setMediumId] = useState<string>("");
  const [count, setCount] = useState("5");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (stop) {
      setMediumId(mediums[0]?.id ?? "");
      setCount("5");
      setNotes("");
    }
  }, [stop, mediums]);

  async function handleSave() {
    if (!stop) return;
    setSaving(true);
    const medium = mediums.find(m => m.id === mediumId);
    const { error } = await supabase
      .from("flyer_stop_visits" as never)
      .insert({
        campaign_id: campaignId,
        zone_id: zoneId,
        zone_number: zoneNumber,
        stop_key: stop.key,
        stop_name: stop.name,
        medium_id: mediumId || null,
        medium_name: medium?.name ?? null,
        flyer_count: parseInt(count, 10) || 0,
        visited_by: currentUserId,
        visited_by_name: displayName,
        assignment_id: assignmentId ?? null,
        notes: notes.trim() || null,
      } as never);
    setSaving(false);
    if (error) {
      toast.error("Failed to save visit");
      return;
    }
    toast.success(`${stop.name} logged!`);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!existingVisit) return;
    setDeleting(true);
    const { error } = await supabase
      .from("flyer_stop_visits" as never)
      .delete()
      .eq("id", existingVisit.id as never);
    setDeleting(false);
    if (error) {
      toast.error("Failed to remove visit");
      return;
    }
    toast.success("Visit removed");
    onSaved();
    onClose();
  }

  return (
    <Sheet open={!!stop} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-start gap-2">
            <MapPin className="w-5 h-5 mt-0.5 text-primary shrink-0" />
            <span>{stop?.name}</span>
          </SheetTitle>
          {stop?.address && (
            <p className="text-sm text-muted-foreground">{stop.address}</p>
          )}
        </SheetHeader>

        {existingVisit ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/30 text-sm space-y-1">
              <p className="font-medium text-green-700 dark:text-green-400">
                Already visited
              </p>
              <p>
                {existingVisit.flyer_count} flyer
                {existingVisit.flyer_count !== 1 ? "s" : ""} ·{" "}
                {existingVisit.medium_name ?? "—"}
              </p>
              {existingVisit.notes && (
                <p className="text-muted-foreground italic">
                  {existingVisit.notes}
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Removing…" : "Remove Visit"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Medium</Label>
              <Select value={mediumId} onValueChange={setMediumId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flyer type" />
                </SelectTrigger>
                <SelectContent>
                  {mediums.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flyers Left</Label>
              <div className="flex gap-2">
                {["3", "5", "8", "10"].map(n => (
                  <Button
                    key={n}
                    variant={count === n ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  className="w-16 text-center"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Spoke to manager, left at front desk…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !mediumId}
            >
              {saving ? "Saving…" : "Log Visit"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FieldChecklist({
  campaignId,
  dbZones,
  assignedZones,
  assignmentId,
  currentUserId,
  displayName,
}: FieldChecklistProps) {
  const [visits, setVisits] = useState<StopVisit[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<DropStop | null>(null);
  const [selectedZone, setSelectedZone] = useState<DbZone | null>(null);

  // Which zones to show
  const visibleZones = dbZones
    .filter(z => !assignedZones || assignedZones.includes(z.zone_number))
    .sort((a, b) => a.zone_number - b.zone_number);

  const loadData = useCallback(async () => {
    const [visitsRes, mediumsRes] = await Promise.all([
      supabase
        .from("flyer_stop_visits" as never)
        .select("id, stop_key, zone_number, medium_name, flyer_count, visited_by_name, visited_at, notes")
        .eq("campaign_id" as never, campaignId as never),
      supabase
        .from("flyer_mediums" as never)
        .select("id, name, sort_order")
        .eq("active" as never, true as never)
        .order("sort_order" as never),
    ]);
    if (visitsRes.data)
      setVisits((visitsRes.data as unknown) as StopVisit[]);
    if (mediumsRes.data)
      setMediums((mediumsRes.data as unknown) as Medium[]);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build visit index: stop_key → latest visit
  const visitIndex = new Map<string, StopVisit>();
  for (const v of visits) {
    if (!visitIndex.has(v.stop_key)) visitIndex.set(v.stop_key, v);
  }

  const totalStops = visibleZones.reduce(
    (acc, z) =>
      acc +
      getStopsForZone(z.zone_number).filter(
        s => !(z.zone_number === 14 && s.key === "z14_regional_note"),
      ).length,
    0,
  );
  const doneStops = visibleZones.reduce(
    (acc, z) =>
      acc +
      getStopsForZone(z.zone_number).filter(
        s =>
          !(z.zone_number === 14 && s.key === "z14_regional_note") &&
          visitIndex.has(s.key),
      ).length,
    0,
  );
  const overallPct =
    totalStops === 0 ? 0 : Math.round((doneStops / totalStops) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading checklist…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Overall progress */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {doneStops}/{totalStops} stops
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overallPct === 100 ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
        <Badge variant={overallPct === 100 ? "default" : "secondary"}>
          {overallPct}%
        </Badge>
      </div>

      {/* Zone list */}
      <Accordion type="multiple" className="divide-y">
        {visibleZones.map(zone => {
          const stops = getStopsForZone(zone.zone_number).filter(
            s => !(zone.zone_number === 14 && s.key === "z14_regional_note"),
          );
          const zoneVisits = visits.filter(
            v => v.zone_number === zone.zone_number,
          );
          const doneCount = stops.filter(s => visitIndex.has(s.key)).length;
          const isDone = doneCount === stops.length && stops.length > 0;

          return (
            <AccordionItem
              key={zone.id}
              value={String(zone.zone_number)}
              className="border-0"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-start gap-3 w-full text-left">
                  <span
                    className={cn(
                      "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                      isDone
                        ? "bg-green-500 text-white"
                        : doneCount > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {zone.zone_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium text-sm leading-tight">
                      {zone.zone_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {zone.city}
                    </span>
                  </div>
                  <ZoneProgress zoneNumber={zone.zone_number} visits={zoneVisits} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {stops.map(stop => (
                    <StopRow
                      key={stop.key}
                      stop={stop}
                      visit={visitIndex.get(stop.key)}
                      onTap={s => {
                        setSelectedStop(s);
                        setSelectedZone(zone);
                      }}
                    />
                  ))}
                  {stops.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground italic">
                      No stops defined for this zone.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Log visit bottom sheet */}
      {selectedStop && selectedZone && (
        <LogSheet
          stop={selectedStop}
          zoneId={selectedZone.id}
          zoneNumber={selectedZone.zone_number}
          campaignId={campaignId}
          existingVisit={visitIndex.get(selectedStop.key)}
          mediums={mediums}
          assignmentId={assignmentId}
          currentUserId={currentUserId}
          displayName={displayName}
          onSaved={loadData}
          onClose={() => {
            setSelectedStop(null);
            setSelectedZone(null);
          }}
        />
      )}
    </div>
  );
}
