/**
 * ZoneStopsDialog
 *
 * Opens when an admin clicks a zone in FlyerCampaigns. Shows every business
 * stop on that zone's route as a tile, with full CRUD against
 * `flyer_stop_visits` (log / edit / delete a drop visit per stop).
 *
 * Data sources:
 *  - Static: ZONE_STOPS[zoneNumber] from flyerRouteData.ts (190+ businesses)
 *  - Live:   public.flyer_stop_visits filtered by campaign_id + zone_number
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStopsForZone, type DropStop } from "./flyerRouteData";
import type { FlyerZone } from "./flyerZoneData";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  Star,
  Plane,
  Crosshair,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StopVisit {
  id: string;
  campaign_id: string;
  zone_id: string;
  zone_number: number;
  stop_key: string;
  stop_name: string;
  flyer_count: number;
  interaction_flags: string[];
  contact_name: string | null;
  contact_title: string | null;
  visited_by: string;
  visited_by_name: string | null;
  notes: string | null;
  visited_at: string;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  mailing_consent: boolean | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: FlyerZone | null;
  zoneDbId: string | null;
  campaignId: string | null;
}

const INTERACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "left_at_door",       label: "Left at door" },
  { value: "handed_to_owner",    label: "Handed to owner" },
  { value: "handed_to_employee", label: "Handed to employee" },
  { value: "spoke_w_decision",   label: "Spoke w/ decision maker" },
  { value: "no_contact",         label: "No contact possible" },
  { value: "closed",             label: "Business closed" },
  { value: "follow_up",          label: "Needs follow-up" },
];

const emptyForm = () => ({
  flyer_count: 1,
  contact_name: "",
  contact_title: "",
  business_email: "",
  business_phone: "",
  business_address: "",
  mailing_consent: false,
  notes: "",
  interaction_flags: [] as string[],
});

type FormState = ReturnType<typeof emptyForm>;

// ─── Component ──────────────────────────────────────────────────────────────

export function ZoneStopsDialog({
  open,
  onOpenChange,
  zone,
  zoneDbId,
  campaignId,
}: Props) {
  const { user, profile } = useAuth();
  const [visits, setVisits] = useState<StopVisit[]>([]);
  const [loading, setLoading] = useState(false);

  // Per-stop editor state
  const [editingStop, setEditingStop] = useState<DropStop | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null);

  const stops = useMemo<DropStop[]>(
    () => (zone ? getStopsForZone(zone.zoneNumber) : []),
    [zone],
  );

  // ── Fetch visits for this zone ────────────────────────────────────────────
  const fetchVisits = useCallback(async () => {
    if (!open || !zone || !campaignId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("flyer_stop_visits" as never)
      .select(
        "id,campaign_id,zone_id,zone_number,stop_key,stop_name,flyer_count,interaction_flags,contact_name,contact_title,visited_by,visited_by_name,notes,visited_at,business_email,business_phone,business_address,mailing_consent",
      )
      .eq("campaign_id" as never, campaignId as never)
      .eq("zone_number" as never, zone.zoneNumber as never)
      .order("visited_at" as never, { ascending: false } as never) as unknown as {
        data: StopVisit[] | null;
        error: unknown;
      };

    if (error) {
      console.error("[ZoneStopsDialog] fetch error", error);
      toast.error("Could not load visits for this zone.");
    } else {
      setVisits(data ?? []);
    }
    setLoading(false);
  }, [open, zone, campaignId]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Reset editor when dialog closes
  useEffect(() => {
    if (!open) {
      setEditingStop(null);
      setEditingVisitId(null);
      setForm(emptyForm());
    }
  }, [open]);

  // Group visits by stop_key for tile previews
  const visitsByStop = useMemo(() => {
    const map = new Map<string, StopVisit[]>();
    for (const v of visits) {
      const arr = map.get(v.stop_key) ?? [];
      arr.push(v);
      map.set(v.stop_key, arr);
    }
    return map;
  }, [visits]);

  // ── Open create/edit form ─────────────────────────────────────────────────
  function openCreate(stop: DropStop) {
    setEditingStop(stop);
    setEditingVisitId(null);
    setForm({
      ...emptyForm(),
      business_address: `${stop.address}, ${stop.city} ${stop.zip}`,
      business_phone: stop.phone ?? "",
    });
  }

  function openEdit(stop: DropStop, v: StopVisit) {
    setEditingStop(stop);
    setEditingVisitId(v.id);
    setForm({
      flyer_count: v.flyer_count,
      contact_name: v.contact_name ?? "",
      contact_title: v.contact_title ?? "",
      business_email: v.business_email ?? "",
      business_phone: v.business_phone ?? "",
      business_address: v.business_address ?? "",
      mailing_consent: !!v.mailing_consent,
      notes: v.notes ?? "",
      interaction_flags: v.interaction_flags ?? [],
    });
  }

  function closeEditor() {
    setEditingStop(null);
    setEditingVisitId(null);
    setForm(emptyForm());
  }

  // ── Save (create / update) ────────────────────────────────────────────────
  async function saveVisit() {
    if (!editingStop || !zone || !zoneDbId || !campaignId || !user) {
      toast.error("Missing campaign or zone context.");
      return;
    }
    setSaving(true);

    const visitedByName =
      profile?.first_name || profile?.last_name
        ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
        : user.email ?? "Unknown";

    const payload = {
      campaign_id:       campaignId,
      zone_id:           zoneDbId,
      zone_number:       zone.zoneNumber,
      stop_key:          editingStop.key,
      stop_name:         editingStop.name,
      flyer_count:       Math.max(0, Number(form.flyer_count) || 0),
      interaction_flags: form.interaction_flags,
      contact_name:      form.contact_name || null,
      contact_title:     form.contact_title || null,
      visited_by:        user.id,
      visited_by_name:   visitedByName,
      notes:             form.notes || null,
      business_email:    form.business_email || null,
      business_phone:    form.business_phone || null,
      business_address:  form.business_address || null,
      mailing_consent:   form.mailing_consent,
    };

    const query = editingVisitId
      ? supabase
          .from("flyer_stop_visits" as never)
          .update(payload as never)
          .eq("id" as never, editingVisitId as never)
      : supabase
          .from("flyer_stop_visits" as never)
          .insert(payload as never);

    const { error } = (await query) as unknown as { error: unknown };

    setSaving(false);
    if (error) {
      console.error("[ZoneStopsDialog] save error", error);
      toast.error(editingVisitId ? "Could not update visit." : "Could not log visit.");
      return;
    }
    toast.success(editingVisitId ? "Visit updated." : "Visit logged.");
    closeEditor();
    fetchVisits();
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteVisitId) return;
    const { error } = (await supabase
      .from("flyer_stop_visits" as never)
      .delete()
      .eq("id" as never, deleteVisitId as never)) as unknown as { error: unknown };

    if (error) {
      console.error("[ZoneStopsDialog] delete error", error);
      toast.error("Could not delete visit.");
    } else {
      toast.success("Visit deleted.");
      fetchVisits();
    }
    setDeleteVisitId(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!zone) return null;

  const visitedStops = stops.filter((s) => (visitsByStop.get(s.key)?.length ?? 0) > 0).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">
                z{String(zone.zoneNumber).padStart(2, "0")}
              </span>
              {zone.zoneName}
              <Badge variant="outline" className="text-xs">
                {visitedStops}/{stops.length} visited
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {zone.city} · {stops.length} target businesses on this route. Tap a tile to log,
              edit, or delete a flyer-drop visit.
            </DialogDescription>
          </DialogHeader>

          {/* Editor panel slides in above the grid when active */}
          {editingStop && (
            <Card className="border-primary/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">
                      {editingVisitId ? "Edit visit" : "Log visit"} — {editingStop.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{editingStop.address}, {editingStop.city}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeEditor}>Cancel</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Flyers left</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.flyer_count}
                      onChange={(e) => setForm((f) => ({ ...f, flyer_count: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Contact name</Label>
                    <Input
                      value={form.contact_name}
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Owner / manager"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Contact title</Label>
                    <Input
                      value={form.contact_title}
                      onChange={(e) => setForm((f) => ({ ...f, contact_title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Business phone</Label>
                    <Input
                      value={form.business_phone}
                      onChange={(e) => setForm((f) => ({ ...f, business_phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Business email</Label>
                    <Input
                      type="email"
                      value={form.business_email}
                      onChange={(e) => setForm((f) => ({ ...f, business_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Business address</Label>
                    <Input
                      value={form.business_address}
                      onChange={(e) => setForm((f) => ({ ...f, business_address: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Interaction flags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {INTERACTION_OPTIONS.map((opt) => {
                      const active = form.interaction_flags.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              interaction_flags: active
                                ? f.interaction_flags.filter((x) => x !== opt.value)
                                : [...f.interaction_flags, opt.value],
                            }))
                          }
                          className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mailing-consent"
                    checked={form.mailing_consent}
                    onCheckedChange={(c) => setForm((f) => ({ ...f, mailing_consent: !!c }))}
                  />
                  <Label htmlFor="mailing-consent" className="text-xs">
                    Mailing consent — owner agreed to receive follow-up
                  </Label>
                </div>

                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="What did they say? Best time to follow up?"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closeEditor}>Cancel</Button>
                  <Button size="sm" onClick={saveVisit} disabled={saving}>
                    {saving ? "Saving…" : editingVisitId ? "Update visit" : "Log visit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stops grid */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading stops…</p>
          ) : stops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No target businesses defined for this zone yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stops.map((stop) => {
                const stopVisits = visitsByStop.get(stop.key) ?? [];
                const latest = stopVisits[0];
                return (
                  <Card
                    key={stop.key}
                    className={`transition-colors ${
                      latest ? "border-green-500/40 bg-green-500/5" : "hover:border-primary/40"
                    }`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <h5 className="font-semibold text-sm truncate">{stop.name}</h5>
                            {stop.isPriority && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {stop.isAerospace && <Plane className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                            {stop.isFirearms && <Crosshair className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            {stop.isOffRoad && <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{stop.address}, {stop.city} {stop.zip}</span>
                          </p>
                          {stop.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              {stop.phone}
                            </p>
                          )}
                        </div>
                        {latest && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                      </div>

                      {stop.notes && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">{stop.notes}</p>
                      )}

                      {latest && (
                        <div className="text-[11px] border-t pt-2 space-y-0.5">
                          <p>
                            <span className="text-muted-foreground">Last visit:</span>{" "}
                            {new Date(latest.visited_at).toLocaleDateString()} ·{" "}
                            {latest.visited_by_name ?? "—"} · {latest.flyer_count} flyer(s)
                          </p>
                          {latest.contact_name && (
                            <p className="text-muted-foreground truncate">Contact: {latest.contact_name}</p>
                          )}
                          {latest.business_email && (
                            <p className="text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" /> {latest.business_email}
                            </p>
                          )}
                          {stopVisits.length > 1 && (
                            <p className="text-muted-foreground">
                              +{stopVisits.length - 1} earlier visit(s)
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1 pt-1">
                        <Button
                          size="sm"
                          variant={latest ? "outline" : "default"}
                          className="flex-1 h-7 text-xs"
                          onClick={() => openCreate(stop)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Log visit
                        </Button>
                        {latest && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => openEdit(stop, latest)}
                              title="Edit latest visit"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteVisitId(latest.id)}
                              title="Delete latest visit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVisitId} onOpenChange={(o) => !o && setDeleteVisitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              The visit record will be removed permanently. This does not delete the business
              from the route — you can log a fresh visit any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
