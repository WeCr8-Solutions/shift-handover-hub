import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { MATERIAL_TYPES, PART_SHAPES } from "@/components/queue/PartSpecsSection";

interface PartCatalogEntry {
  id: string;
  part_number: string;
  description: string | null;
  material_type: string | null;
  part_length_inches: number | null;
  part_width_inches: number | null;
  part_height_inches: number | null;
  part_weight_lbs: number | null;
  part_shape: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  part_number: string;
  description: string;
  material_type: string;
  part_length_inches: string;
  part_width_inches: string;
  part_height_inches: string;
  part_weight_lbs: string;
  part_shape: string;
}

const emptyForm: FormData = {
  part_number: "",
  description: "",
  material_type: "",
  part_length_inches: "",
  part_width_inches: "",
  part_height_inches: "",
  part_weight_lbs: "",
  part_shape: "",
};

export function PartCatalogManager() {
  const { organization } = useOrgContext();
  const [entries, setEntries] = useState<PartCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!organization?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase.from("part_catalog").select("*").eq("organization_id", organization.id).order("part_number");

      if (search.trim()) {
        const safeSearch = search.trim();
        query = query.or(
          `part_number.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,material_type.ilike.%${safeSearch}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        toast.error(error.message);
        setEntries([]);
        return;
      }

      setEntries((data as PartCatalogEntry[]) || []);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, search]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entry: PartCatalogEntry) => {
    setEditingId(entry.id);
    setFormData({
      part_number: entry.part_number,
      description: entry.description || "",
      material_type: entry.material_type || "",
      part_length_inches: entry.part_length_inches?.toString() || "",
      part_width_inches: entry.part_width_inches?.toString() || "",
      part_height_inches: entry.part_height_inches?.toString() || "",
      part_weight_lbs: entry.part_weight_lbs?.toString() || "",
      part_shape: entry.part_shape || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!organization?.id) return;

    if (!formData.part_number.trim()) {
      toast.error("Part number is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        organization_id: organization.id,
        part_number: formData.part_number.trim(),
        description: formData.description.trim() || null,
        material_type: formData.material_type || null,
        part_length_inches: formData.part_length_inches ? parseFloat(formData.part_length_inches) : null,
        part_width_inches: formData.part_width_inches ? parseFloat(formData.part_width_inches) : null,
        part_height_inches: formData.part_height_inches ? parseFloat(formData.part_height_inches) : null,
        part_weight_lbs: formData.part_weight_lbs ? parseFloat(formData.part_weight_lbs) : null,
        part_shape: formData.part_shape || null,
      };

      if (editingId) {
        const { error } = await supabase.from("part_catalog").update(payload).eq("id", editingId);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Part updated");
      } else {
        const { error } = await supabase.from("part_catalog").insert(payload);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Part created");
      }

      setDialogOpen(false);
      await fetchEntries();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("part_catalog").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Part deleted");
    await fetchEntries();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Part Catalog
          </CardTitle>
          <CardDescription>
            Manage reusable part profiles. When creating work orders, you can auto-fill specs from this catalog.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by part number or material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No parts in catalog yet</p>
              <p className="mt-1 text-xs">Add parts to auto-fill specs on work orders</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part #</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Shape</TableHead>
                    <TableHead>Dimensions (L×W×H)</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <span className="font-mono font-medium">{entry.part_number}</span>
                          {entry.description && (
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {entry.material_type ? (
                          <Badge variant="secondary" className="text-xs">
                            {entry.material_type}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="text-sm capitalize">{entry.part_shape || "—"}</TableCell>

                      <TableCell className="font-mono text-sm">
                        {entry.part_length_inches || entry.part_width_inches || entry.part_height_inches
                          ? `${entry.part_length_inches ?? "—"} × ${entry.part_width_inches ?? "—"} × ${entry.part_height_inches ?? "—"}`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {entry.part_weight_lbs ? `${entry.part_weight_lbs} lbs` : "—"}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                            <Pencil className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Part" : "Add Part to Catalog"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  Part Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  placeholder="e.g. 12345-A"
                />
              </div>

              <div className="space-y-2">
                <Label>Material Type</Label>
                <Select
                  value={formData.material_type || "none"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      material_type: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {MATERIAL_TYPES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional part description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Part Shape</Label>
                <Select
                  value={formData.part_shape || "none"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      part_shape: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PART_SHAPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={formData.part_weight_lbs}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      part_weight_lbs: e.target.value,
                    })
                  }
                  placeholder="lbs"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Length (in)</Label>
                <Input
                  type="number"
                  value={formData.part_length_inches}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      part_length_inches: e.target.value,
                    })
                  }
                  placeholder="L"
                  min="0"
                  step="0.001"
                />
              </div>

              <div className="space-y-2">
                <Label>Width (in)</Label>
                <Input
                  type="number"
                  value={formData.part_width_inches}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      part_width_inches: e.target.value,
                    })
                  }
                  placeholder="W"
                  min="0"
                  step="0.001"
                />
              </div>

              <div className="space-y-2">
                <Label>Height (in)</Label>
                <Input
                  type="number"
                  value={formData.part_height_inches}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      part_height_inches: e.target.value,
                    })
                  }
                  placeholder="H"
                  min="0"
                  step="0.001"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
