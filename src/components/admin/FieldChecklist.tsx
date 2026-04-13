/**
 * FieldChecklist.tsx — Mobile-first flyer drop field checklist
 *
 * Per-stop features:
 *  - Color-coded rows based on last interaction type
 *  - Full running visit history per business
 *  - Interaction checkboxes (spoke to, left at desk, no one home, etc.)
 *  - Point of contact name + title
 *  - Flyer type recommendation based on business category
 *  - Flyer count starting at 1
 *  - Free-text notes
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStopsForZone, DropStop } from "./flyerRouteData";
import { toast } from "sonner";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MapPin, Star, Shield, Zap, Plus, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Interaction options ──────────────────────────────────────────────────────

export const INTERACTION_OPTIONS = [
  { key: "spoke_to_person",   label: "Spoke with someone",           needsContact: true  },
  { key: "left_front_desk",   label: "Left at front desk",           needsContact: false },
  { key: "left_lobby",        label: "Left in lobby / waiting area", needsContact: false },
  { key: "left_with_manager", label: "Left with manager / owner",    needsContact: true  },
  { key: "qr_scanned",        label: "QR code scanned / interest shown", needsContact: true },
  { key: "follow_up",         label: "Will follow up",               needsContact: false },
  { key: "no_one_available",  label: "No one available",             needsContact: false },
  { key: "closed",            label: "Business closed / locked",     needsContact: false },
  { key: "not_interested",    label: "Not interested",               needsContact: false },
] as const;

type InteractionKey = typeof INTERACTION_OPTIONS[number]["key"];

// ─── Flyer designs (content / campaign type) ─────────────────────────────────
// Each entry represents a distinct flyer design with its own message/audience.
// Expand this list as new designs are printed.

export const FLYER_DESIGNS = [
  {
    id: "cnc-machinist",
    name: "CNC & Machinist",
    description: "Job tracking, shift handover, work orders for CNC operators & machinists",
    suggestFor: (s: DropStop) => !s.isFirearms && !s.isAerospace && !s.isOffRoad,
  },
  {
    id: "welding-fab",
    name: "Welding & Fabrication",
    description: "Shift handover and job tracking for welders and metal fabricators",
    suggestFor: (s: DropStop) => s.isOffRoad || (!s.isFirearms && !s.isAerospace),
  },
  {
    id: "aerospace-defense",
    name: "Aerospace & Defense",
    description: "Compliance-ready job tracking for aerospace and defense shops",
    suggestFor: (s: DropStop) => s.isAerospace,
  },
  {
    id: "offroad-performance",
    name: "Off-Road & Performance",
    description: "Build tracking and team coordination for off-road and performance shops",
    suggestFor: (s: DropStop) => s.isOffRoad,
  },
  {
    id: "firearms-gunsmith",
    name: "Firearms & Gunsmith",
    description: "Work order and compliance tracking for gunsmith shops",
    suggestFor: (s: DropStop) => s.isFirearms,
  },
  {
    id: "general-job-tracking",
    name: "General Job Tracking",
    description: "Universal Jobline.ai — works for any trade or shop",
    suggestFor: () => true,
  },
  {
    id: "cabinet-woodworking",
    name: "Cabinet & Woodworking",
    description: "Project and job tracking for cabinet makers and woodworking shops",
    suggestFor: () => false, // leave for manual selection
  },
] as const;

export type FlyerDesignId = typeof FLYER_DESIGNS[number]["id"];

/** Returns the best-match design id for a given stop */
function suggestedDesign(stop: DropStop): FlyerDesignId {
  const match = FLYER_DESIGNS.find(d => d.suggestFor(stop));
  return match ? match.id : "general-job-tracking";
}

// ─── Static fallback formats (used if flyer_mediums table not yet migrated) ──

const FALLBACK_MEDIUMS: Medium[] = [
  { id: "full-page",   name: "Full-page Color 8.5×11",        sort_order: 1 },
  { id: "half-page",   name: "Half-page Color",                sort_order: 2 },
  { id: "tri-fold",    name: "Tri-fold",                       sort_order: 3 },
  { id: "small-card",  name: "Small Card (Business Card size)", sort_order: 4 },
  { id: "door-hanger", name: "Door Hanger",                    sort_order: 5 },
];

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
  medium_name: string | null;   // format/size
  flyer_design: string | null;  // content/design type
  flyer_count: number;
  interaction_flags: string[];
  contact_name: string | null;
  contact_title: string | null;
  visited_by_name: string | null;
  visited_at: string;
  notes: string | null;
}

interface FieldChecklistProps {
  campaignId: string;
  dbZones: DbZone[];
  assignedZones?: number[];
  assignmentId?: string;
  currentUserId: string;
  displayName: string;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

type VisitColor = "green" | "blue" | "amber" | "red" | "none";

function visitColor(visits: StopVisit[]): VisitColor {
  if (!visits.length) return "none";
  const flags = visits[0].interaction_flags ?? [];
  if (flags.includes("spoke_to_person") || flags.includes("qr_scanned") || flags.includes("left_with_manager")) return "green";
  if (flags.includes("left_front_desk") || flags.includes("left_lobby")) return "blue";
  if (flags.includes("follow_up")) return "blue";
  if (flags.includes("no_one_available") || flags.includes("closed")) return "amber";
  if (flags.includes("not_interested")) return "red";
  return "green"; // visited, no specific flag
}

const COLOR_ICON: Record<VisitColor, string> = {
  green: "text-green-500",
  blue:  "text-blue-500",
  amber: "text-amber-500",
  red:   "text-red-400",
  none:  "text-muted-foreground",
};

const COLOR_ROW: Record<VisitColor, string> = {
  green: "bg-green-50/60 dark:bg-green-950/20",
  blue:  "bg-blue-50/60 dark:bg-blue-950/20",
  amber: "bg-amber-50/60 dark:bg-amber-950/20",
  red:   "bg-red-50/40 dark:bg-red-950/10",
  none:  "bg-background",
};

// ─── Visit history row ────────────────────────────────────────────────────────

function VisitHistoryItem({ v }: { v: StopVisit }) {
  const color = visitColor([v]);
  const dateStr = new Date(v.visited_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const timeStr = new Date(v.visited_at).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });
  const flagLabels = (v.interaction_flags ?? [])
    .map(k => INTERACTION_OPTIONS.find(o => o.key === k)?.label ?? k)
    .join(" · ");

  return (
    <div className={cn("rounded-lg border px-3 py-2.5 text-xs space-y-1", {
      "border-green-200 bg-green-50 dark:bg-green-950/30": color === "green",
      "border-blue-200 bg-blue-50 dark:bg-blue-950/30":   color === "blue",
      "border-amber-200 bg-amber-50 dark:bg-amber-950/30": color === "amber",
      "border-red-200 bg-red-50 dark:bg-red-950/20":      color === "red",
      "border bg-muted/30":                                color === "none",
    })}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium">{dateStr} · {timeStr}</span>
        <span className="text-muted-foreground tabular-nums">{v.flyer_count} flyer{v.flyer_count !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {v.medium_name && <Badge variant="outline" className="text-[10px] h-4 px-1">{v.medium_name}</Badge>}
        {v.flyer_design && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1">
            {FLYER_DESIGNS.find(d => d.id === v.flyer_design)?.name ?? v.flyer_design}
          </Badge>
        )}
      </div>
      {flagLabels && <p className="text-muted-foreground">{flagLabels}</p>}
      {(v.contact_name || v.contact_title) && (
        <p className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {[v.contact_name, v.contact_title].filter(Boolean).join(" — ")}
        </p>
      )}
      {v.notes && <p className="italic text-muted-foreground">{v.notes}</p>}
      {v.visited_by_name && (
        <p className="text-muted-foreground">by {v.visited_by_name}</p>
      )}
    </div>
  );
}

// ─── Stop row ─────────────────────────────────────────────────────────────────

function StopRow({ stop, visits, onTap }: {
  stop: DropStop;
  visits: StopVisit[];
  onTap: (stop: DropStop) => void;
}) {
  const color  = visitColor(visits);
  const latest = visits[0];

  return (
    <button
      type="button"
      onClick={() => onTap(stop)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 text-left active:opacity-70 transition-colors",
        COLOR_ROW[color],
      )}
    >
      <span className="mt-0.5 shrink-0">
        {color !== "none"
          ? <CheckCircle2 className={cn("w-5 h-5", COLOR_ICON[color])} />
          : <Circle className="w-5 h-5 text-muted-foreground" />
        }
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("font-medium text-sm", color !== "none" && COLOR_ICON[color])}>
            {stop.name}
          </span>
          {stop.isPriority  && <Star   className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
          {stop.isFirearms  && <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          {stop.isAerospace && <Zap    className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
          {visits.length > 1 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">{visits.length}×</Badge>
          )}
        </span>
        <span className="block text-xs text-muted-foreground truncate">{stop.address}</span>
        {latest && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            Last: {new Date(latest.visited_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {latest.contact_name && ` · ${latest.contact_name}`}
          </span>
        )}
        {!latest && stop.notes && (
          <span className="block text-xs text-muted-foreground mt-0.5 italic">{stop.notes}</span>
        )}
      </span>
      <span className="shrink-0 mt-1">
        <Plus className="w-4 h-4 text-muted-foreground/60" />
      </span>
    </button>
  );
}

// ─── Log Visit sheet ──────────────────────────────────────────────────────────

function LogSheet({
  stop, zoneId, zoneNumber, campaignId, visits, mediums,
  assignmentId, currentUserId, displayName, onSaved, onClose,
}: {
  stop: DropStop | null;
  zoneId: string;
  zoneNumber: number;
  campaignId: string;
  visits: StopVisit[];
  mediums: Medium[];
  assignmentId?: string;
  currentUserId: string;
  displayName: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [mediumId, setMediumId]     = useState("");
  const [flyerDesign, setFlyerDesign] = useState<FlyerDesignId | "">("");
  const [count, setCount]           = useState("5");
  const [flags, setFlags]           = useState<Set<InteractionKey>>(new Set());
  const [contactName, setContactName]   = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (stop) {
      setMediumId(mediums[0]?.id ?? "");
      setFlyerDesign(suggestedDesign(stop));
      setCount("5");
      setFlags(new Set());
      setContactName("");
      setContactTitle("");
      setNotes("");
      setShowHistory(false);
    }
  }, [stop, mediums]);

  const needsContact = [...flags].some(
    f => INTERACTION_OPTIONS.find(o => o.key === f)?.needsContact,
  );

  function toggleFlag(key: InteractionKey) {
    setFlags(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (!stop) return;
    setSaving(true);
    const medium = mediums.find(m => m.id === mediumId);
    const { error } = await supabase
      .from("flyer_stop_visits" as never)
      .insert({
        campaign_id:      campaignId,
        zone_id:          zoneId,
        zone_number:      zoneNumber,
        stop_key:         stop.key,
        stop_name:        stop.name,
        medium_id:        mediumId || null,
        medium_name:      medium?.name ?? null,
        flyer_design:     flyerDesign || null,
        flyer_count:      parseInt(count, 10) || 0,
        interaction_flags: [...flags],
        contact_name:     contactName.trim() || null,
        contact_title:    contactTitle.trim() || null,
        visited_by:       currentUserId,
        visited_by_name:  displayName,
        assignment_id:    assignmentId ?? null,
        notes:            notes.trim() || null,
      } as never);
    setSaving(false);
    if (error) { toast.error("Failed to save visit"); return; }
    toast.success(`${stop.name} logged!`);
    onSaved();
    onClose();
  }

  if (!stop) return null;

  return (
    <Sheet open={!!stop} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto pb-8">
        <SheetHeader className="mb-3">
          <SheetTitle className="flex items-start gap-2 text-base">
            <MapPin className="w-5 h-5 mt-0.5 text-primary shrink-0" />
            <span className="leading-tight">{stop.name}</span>
          </SheetTitle>
          {stop.address && (
            <p className="text-xs text-muted-foreground pl-7">{stop.address}</p>
          )}
        </SheetHeader>

        {/* Previous visits toggle */}
        {visits.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2"
            >
              <Clock className="w-3.5 h-3.5" />
              {visits.length} previous visit{visits.length !== 1 ? "s" : ""}
              <span className="text-muted-foreground">({showHistory ? "hide" : "show"})</span>
            </button>
            {showHistory && (
              <div className="space-y-2 mb-3">
                {visits.map(v => <VisitHistoryItem key={v.id} v={v} />)}
              </div>
            )}
          </div>
        )}

        {/* New visit form */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Log {visits.length > 0 ? "Another " : ""}Visit
          </p>

          {/* Flyer design (content/campaign type) */}
          <div className="space-y-1.5">
            <Label className="text-sm">Flyer Design</Label>
            <Select
              value={flyerDesign}
              onValueChange={v => setFlyerDesign(v as FlyerDesignId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Which flyer design?" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200]">
                {FLYER_DESIGNS.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="font-medium">{d.name}</span>
                    <span className="block text-xs text-muted-foreground leading-tight">
                      {d.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {flyerDesign && (
              <p className="text-xs text-muted-foreground">
                {FLYER_DESIGNS.find(d => d.id === flyerDesign)?.description}
              </p>
            )}
          </div>

          {/* Format / size */}
          <div className="space-y-1.5">
            <Label className="text-sm">Format / Size</Label>
            <Select value={mediumId} onValueChange={setMediumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select size…" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200]">
                {mediums.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          <div className="space-y-1.5">
            <Label className="text-sm">How Many Left</Label>
            <div className="flex gap-2 flex-wrap">
              {["1", "3", "5", "8", "10"].map(n => (
                <Button
                  key={n}
                  variant={count === n ? "default" : "outline"}
                  size="sm"
                  className="flex-1 min-w-[2.5rem]"
                  onClick={() => setCount(n)}
                >
                  {n}
                </Button>
              ))}
              <Input
                type="number" min="1" max="99"
                value={count}
                onChange={e => setCount(e.target.value)}
                className="w-16 text-center"
              />
            </div>
          </div>

          {/* Interaction checkboxes */}
          <div className="space-y-2">
            <Label className="text-sm">What happened?</Label>
            <div className="grid grid-cols-1 gap-2">
              {INTERACTION_OPTIONS.map(opt => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    checked={flags.has(opt.key as InteractionKey)}
                    onCheckedChange={() => toggleFlag(opt.key as InteractionKey)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Contact fields — shown when a flag that needs a contact is checked */}
          {needsContact && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">Point of Contact</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. John Smith"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title / Role (optional)</Label>
                <Input
                  placeholder="e.g. Shop Manager, Owner"
                  value={contactTitle}
                  onChange={e => setContactTitle(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes (optional)</Label>
            <Textarea
              placeholder="Anything else worth remembering…"
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
      </SheetContent>
    </Sheet>
  );
}

// ─── Zone progress bar ────────────────────────────────────────────────────────

function ZoneProgress({ zoneNumber, visitMap }: {
  zoneNumber: number;
  visitMap: Map<string, StopVisit[]>;
}) {
  const stops = getStopsForZone(zoneNumber).filter(
    s => !(zoneNumber === 14 && s.key === "z14_regional_note"),
  );
  const done = stops.filter(s => (visitMap.get(s.key)?.length ?? 0) > 0).length;
  const total = stops.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <span
          className={cn("block h-full rounded-full w-[var(--bar-w)]", pct === 100 ? "bg-green-500" : "bg-primary")}
          style={{ "--bar-w": `${pct}%` } as React.CSSProperties}
        />
      </span>
      <span className="tabular-nums text-xs">{done}/{total}</span>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FieldChecklist({
  campaignId, dbZones, assignedZones, assignmentId, currentUserId, displayName,
}: FieldChecklistProps) {
  const [visits,  setVisits]  = useState<StopVisit[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<DropStop | null>(null);
  const [selectedZone, setSelectedZone] = useState<DbZone | null>(null);

  const visibleZones = dbZones
    .filter(z => !assignedZones || assignedZones.includes(z.zone_number))
    .sort((a, b) => a.zone_number - b.zone_number);

  const loadData = useCallback(async () => {
    const [vRes, mRes] = await Promise.all([
      supabase
        .from("flyer_stop_visits" as never)
        .select("id,stop_key,zone_number,medium_name,flyer_design,flyer_count,interaction_flags,contact_name,contact_title,visited_by_name,visited_at,notes")
        .eq("campaign_id" as never, campaignId as never)
        .order("visited_at" as never, { ascending: false }),
      supabase
        .from("flyer_mediums" as never)
        .select("id,name,sort_order")
        .eq("is_active" as never, true as never)
        .order("sort_order" as never),
    ]);
    if (vRes.data) setVisits((vRes.data as unknown) as StopVisit[]);
    // Fall back to static list if table not yet migrated or returns empty
    const dbMediums = (mRes.data as unknown) as Medium[] | null;
    setMediums(dbMediums && dbMediums.length > 0 ? dbMediums : FALLBACK_MEDIUMS);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { loadData(); }, [loadData]);

  // visitMap: stop_key → all visits, newest first
  const visitMap = new Map<string, StopVisit[]>();
  for (const v of visits) {
    const arr = visitMap.get(v.stop_key) ?? [];
    arr.push(v);
    visitMap.set(v.stop_key, arr);
  }

  const totalStops = visibleZones.reduce(
    (acc, z) => acc + getStopsForZone(z.zone_number).filter(
      s => !(z.zone_number === 14 && s.key === "z14_regional_note"),
    ).length, 0,
  );
  const doneStops = visibleZones.reduce(
    (acc, z) => acc + getStopsForZone(z.zone_number).filter(
      s => !(z.zone_number === 14 && s.key === "z14_regional_note") &&
           (visitMap.get(s.key)?.length ?? 0) > 0,
    ).length, 0,
  );
  const overallPct = totalStops === 0 ? 0 : Math.round((doneStops / totalStops) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading checklist…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky overall progress */}
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
              className={cn("h-full rounded-full transition-all w-[var(--bar-w)]", overallPct === 100 ? "bg-green-500" : "bg-primary")}
              style={{ "--bar-w": `${overallPct}%` } as React.CSSProperties}
            />
          </div>
        </div>
        <Badge variant={overallPct === 100 ? "default" : "secondary"}>{overallPct}%</Badge>
      </div>

      {/* Color legend */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground border-b bg-muted/20">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Spoke / interest</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Left materials</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> No one available</span>
        <span className="flex items-center gap-1"><Circle className="w-3.5 h-3.5 text-muted-foreground" /> Not yet visited</span>
      </div>

      {/* Zone accordions */}
      <Accordion type="multiple" className="divide-y">
        {visibleZones.map(zone => {
          const stops = getStopsForZone(zone.zone_number).filter(
            s => !(zone.zone_number === 14 && s.key === "z14_regional_note"),
          );
          const doneCount = stops.filter(s => (visitMap.get(s.key)?.length ?? 0) > 0).length;
          const isDone = doneCount === stops.length && stops.length > 0;

          return (
            <AccordionItem key={zone.id} value={String(zone.zone_number)} className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-start gap-3 w-full text-left">
                  <span className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                    isDone    ? "bg-green-500 text-white"
                    : doneCount > 0 ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  )}>
                    {zone.zone_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium text-sm leading-tight">{zone.zone_name}</span>
                    <span className="block text-xs text-muted-foreground">{zone.city}</span>
                  </div>
                  <ZoneProgress zoneNumber={zone.zone_number} visitMap={visitMap} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {stops.map(stop => (
                    <StopRow
                      key={stop.key}
                      stop={stop}
                      visits={visitMap.get(stop.key) ?? []}
                      onTap={s => { setSelectedStop(s); setSelectedZone(zone); }}
                    />
                  ))}
                  {stops.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground italic">No stops for this zone.</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Log visit sheet */}
      {selectedStop && selectedZone && (
        <LogSheet
          stop={selectedStop}
          zoneId={selectedZone.id}
          zoneNumber={selectedZone.zone_number}
          campaignId={campaignId}
          visits={visitMap.get(selectedStop.key) ?? []}
          mediums={mediums}
          assignmentId={assignmentId}
          currentUserId={currentUserId}
          displayName={displayName}
          onSaved={loadData}
          onClose={() => { setSelectedStop(null); setSelectedZone(null); }}
        />
      )}
    </div>
  );
}
