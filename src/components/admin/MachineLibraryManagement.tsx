import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MANUFACTURERS, MACHINE_TYPES, type MachineLibraryEntry } from "@/hooks/useStationMachineProfile";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Cpu, Plus, Pencil, Trash2, Search, DollarSign, Package, ShieldCheck, X, Loader2, CheckCircle2 } from "lucide-react";

const COMMON_MATERIALS = [
  "Aluminum", "Steel", "Stainless Steel", "Titanium", "Inconel",
  "Brass", "Copper", "Plastics", "Composites", "Tool Steel",
  "Cast Iron", "Magnesium", "Tungsten", "Hastelloy",
];

interface MachineFormData {
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;
  max_x_travel: number | null;
  max_y_travel: number | null;
  max_z_travel: number | null;
  max_part_weight: number | null;
  max_part_envelope_length: number | null;
  max_part_envelope_width: number | null;
  max_part_envelope_height: number | null;
  five_axis_simultaneous: boolean;
  fourth_axis: boolean;
  live_tooling: boolean;
  y_axis_turn: boolean;
  sub_spindle: boolean;
  probing: boolean;
  through_spindle_coolant: boolean;
  pallet_pool: boolean;
  bar_feeder: boolean;
  material_capability: string[];
  typical_tolerance: number | null;
  hard_constraints: any[];
  is_verified: boolean;
}

const emptyForm: MachineFormData = {
  manufacturer: "", model: "", machine_type: "", platform_category: "",
  max_x_travel: null, max_y_travel: null, max_z_travel: null,
  max_part_weight: null, max_part_envelope_length: null, max_part_envelope_width: null, max_part_envelope_height: null,
  five_axis_simultaneous: false, fourth_axis: false, live_tooling: false, y_axis_turn: false,
  sub_spindle: false, probing: false, through_spindle_coolant: false, pallet_pool: false, bar_feeder: false,
  material_capability: [], typical_tolerance: null, hard_constraints: [], is_verified: false,
};

const PLATFORM_CATEGORIES = ["3-Axis", "4-Axis", "5-Axis", "Turn", "Turn/Mill", "Swiss", "Grinder", "EDM", "Waterjet", "Laser", "CMM", "Other"];

export function MachineLibraryManagement() {
  const { toast } = useToast();
  const [library, setLibrary] = useState<MachineLibraryEntry[]>([]);
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MachineFormData>({ ...emptyForm });
  const [hardConstraintsJson, setHardConstraintsJson] = useState("[]");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [libRes, purchRes] = await Promise.all([
      supabase.from("verified_machine_library" as any).select("*").order("manufacturer").order("model"),
      supabase.from("organization_machine_purchases" as any).select("machine_library_id"),
    ]);
    setLibrary((libRes.data as any[]) || []);

    const counts: Record<string, number> = {};
    ((purchRes.data as any[]) || []).forEach((p: any) => {
      counts[p.machine_library_id] = (counts[p.machine_library_id] || 0) + 1;
    });
    setPurchaseCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPurchases = Object.values(purchaseCounts).reduce((a, b) => a + b, 0);
  const revenue = (totalPurchases * 0.99).toFixed(2);

  const filtered = library.filter((m) => {
    const matchSearch = !search || m.manufacturer.toLowerCase().includes(search.toLowerCase()) || m.model.toLowerCase().includes(search.toLowerCase());
    const matchMfr = filterManufacturer === "all" || m.manufacturer === filterManufacturer;
    const matchType = filterType === "all" || m.machine_type === filterType;
    return matchSearch && matchMfr && matchType;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setHardConstraintsJson("[]");
    setDialogOpen(true);
  };

  const openEdit = (m: MachineLibraryEntry) => {
    setEditingId(m.id);
    setForm({
      manufacturer: m.manufacturer, model: m.model, machine_type: m.machine_type,
      platform_category: m.platform_category || "",
      max_x_travel: m.max_x_travel, max_y_travel: m.max_y_travel, max_z_travel: m.max_z_travel,
      max_part_weight: m.max_part_weight, max_part_envelope_length: m.max_part_envelope_length,
      max_part_envelope_width: m.max_part_envelope_width, max_part_envelope_height: m.max_part_envelope_height,
      five_axis_simultaneous: m.five_axis_simultaneous, fourth_axis: m.fourth_axis,
      live_tooling: m.live_tooling, y_axis_turn: m.y_axis_turn, sub_spindle: m.sub_spindle,
      probing: m.probing, through_spindle_coolant: m.through_spindle_coolant,
      pallet_pool: m.pallet_pool, bar_feeder: m.bar_feeder,
      material_capability: m.material_capability || [], typical_tolerance: m.typical_tolerance,
      hard_constraints: m.hard_constraints || [], is_verified: m.is_verified,
    });
    setHardConstraintsJson(JSON.stringify(m.hard_constraints || [], null, 2));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.manufacturer || !form.model || !form.machine_type) {
      toast({ title: "Validation", description: "Manufacturer, model, and type are required.", variant: "destructive" });
      return;
    }
    let parsedConstraints: any[] = [];
    try { parsedConstraints = JSON.parse(hardConstraintsJson); } catch { parsedConstraints = []; }

    setSaving(true);
    const payload = { ...form, hard_constraints: parsedConstraints } as any;

    if (editingId) {
      const { error } = await supabase.from("verified_machine_library" as any).update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Updated", description: `${form.manufacturer} ${form.model} updated.` }); }
    } else {
      const { error } = await supabase.from("verified_machine_library" as any).insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Created", description: `${form.manufacturer} ${form.model} added to library.` }); }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (m: MachineLibraryEntry) => {
    if (purchaseCounts[m.id]) return;
    if (!confirm(`Delete ${m.manufacturer} ${m.model}? This cannot be undone.`)) return;
    const { error } = await supabase.from("verified_machine_library" as any).delete().eq("id", m.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchData(); }
  };

  const setNum = (key: keyof MachineFormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val === "" ? null : Number(val) }));
  };

  const toggleMaterial = (mat: string) => {
    setForm((f) => ({
      ...f,
      material_capability: f.material_capability.includes(mat) ? f.material_capability.filter((m) => m !== mat) : [...f.material_capability, mat],
    }));
  };

  const toggleBool = (key: keyof MachineFormData) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const uniqueManufacturers = [...new Set(library.map((m) => m.manufacturer))].sort();

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{library.length}</p>
              <p className="text-sm text-muted-foreground">Machine Profiles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalPurchases}</p>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">${revenue}</p>
              <p className="text-sm text-muted-foreground">Estimated Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search manufacturer or model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {uniqueManufacturers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Machine Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {MACHINE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Machine</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-center">Travel (X/Y/Z)</TableHead>
                    <TableHead className="text-center">Verified</TableHead>
                    <TableHead className="text-center">Purchases</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No machines found</TableCell></TableRow>
                  )}
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.manufacturer}</TableCell>
                      <TableCell>{m.model}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.machine_type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.platform_category}</TableCell>
                      <TableCell className="text-center text-sm font-mono">
                        {m.max_x_travel ?? "—"} / {m.max_y_travel ?? "—"} / {m.max_z_travel ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {m.is_verified ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={purchaseCounts[m.id] ? "default" : "secondary"}>{purchaseCounts[m.id] || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button variant="ghost" size="icon" disabled={!!purchaseCounts[m.id]} onClick={() => handleDelete(m)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {purchaseCounts[m.id] && <TooltipContent>Cannot delete — {purchaseCounts[m.id]} active purchase(s)</TooltipContent>}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Machine Profile" : "Add Machine Profile"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Identity */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Manufacturer *</Label>
                    <Select value={form.manufacturer} onValueChange={(v) => setForm((f) => ({ ...f, manufacturer: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{MANUFACTURERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Model *</Label><Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} /></div>
                  <div>
                    <Label>Machine Type *</Label>
                    <Select value={form.machine_type} onValueChange={(v) => setForm((f) => ({ ...f, machine_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{MACHINE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Platform Category</Label>
                    <Select value={form.platform_category} onValueChange={(v) => setForm((f) => ({ ...f, platform_category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{PLATFORM_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Travel & Envelope */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Travel & Envelope (inches/lbs)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>X Travel</Label><Input type="number" value={form.max_x_travel ?? ""} onChange={(e) => setNum("max_x_travel", e.target.value)} /></div>
                  <div><Label>Y Travel</Label><Input type="number" value={form.max_y_travel ?? ""} onChange={(e) => setNum("max_y_travel", e.target.value)} /></div>
                  <div><Label>Z Travel</Label><Input type="number" value={form.max_z_travel ?? ""} onChange={(e) => setNum("max_z_travel", e.target.value)} /></div>
                  <div><Label>Max Part Weight</Label><Input type="number" value={form.max_part_weight ?? ""} onChange={(e) => setNum("max_part_weight", e.target.value)} /></div>
                  <div><Label>Envelope Length</Label><Input type="number" value={form.max_part_envelope_length ?? ""} onChange={(e) => setNum("max_part_envelope_length", e.target.value)} /></div>
                  <div><Label>Envelope Width</Label><Input type="number" value={form.max_part_envelope_width ?? ""} onChange={(e) => setNum("max_part_envelope_width", e.target.value)} /></div>
                  <div><Label>Envelope Height</Label><Input type="number" value={form.max_part_envelope_height ?? ""} onChange={(e) => setNum("max_part_envelope_height", e.target.value)} /></div>
                </div>
              </div>
              <Separator />

              {/* Capabilities */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Capabilities</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(["five_axis_simultaneous", "fourth_axis", "live_tooling", "y_axis_turn", "sub_spindle", "probing", "through_spindle_coolant", "pallet_pool", "bar_feeder"] as const).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox checked={form[key] as boolean} onCheckedChange={() => toggleBool(key)} id={key} />
                      <Label htmlFor={key} className="text-sm cursor-pointer">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />

              {/* Materials */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Material Capability</h4>
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_MATERIALS.map((mat) => (
                    <div key={mat} className="flex items-center gap-2">
                      <Checkbox checked={form.material_capability.includes(mat)} onCheckedChange={() => toggleMaterial(mat)} id={`mat-${mat}`} />
                      <Label htmlFor={`mat-${mat}`} className="text-sm cursor-pointer">{mat}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />

              {/* Tolerances & Constraints */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Tolerances & Constraints</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Typical Tolerance (in)</Label><Input type="number" step="0.0001" value={form.typical_tolerance ?? ""} onChange={(e) => setNum("typical_tolerance", e.target.value)} /></div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={form.is_verified} onCheckedChange={() => toggleBool("is_verified")} id="is_verified" />
                    <Label htmlFor="is_verified" className="cursor-pointer flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verified</Label>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Hard Constraints (JSON)</Label>
                  <Textarea className="font-mono text-xs" rows={4} value={hardConstraintsJson} onChange={(e) => setHardConstraintsJson(e.target.value)} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Add Machine"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
