import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CustomerCombobox } from "@/components/queue/CustomerCombobox";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PartRow {
  title: string;
  part_number: string;
  quantity: string;
  description: string;
}

function emptyRow(): PartRow {
  return { title: "", part_number: "", quantity: "1", description: "" };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (packageId: string) => void;
}

export function PackageBuilderDialog({ open, onOpenChange, onCreated }: Props) {
  const { organization } = useOrgContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [shipDate, setShipDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isQuote, setIsQuote] = useState(false);
  const [rows, setRows] = useState<PartRow[]>([emptyRow(), emptyRow()]);
  const [saving, setSaving] = useState(false);

  const updateRow = (idx: number, patch: Partial<PartRow>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (idx: number) =>
    setRows((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== idx)));

  const validRows = rows.filter((r) => (r.title.trim() || r.part_number.trim()) && r.quantity);

  const reset = () => {
    setTitle("");
    setCustomerId(null);
    setShipDate("");
    setNotes("");
    setIsQuote(false);
    setRows([emptyRow(), emptyRow()]);
  };

  const submit = async () => {
    if (!organization?.id) return;
    if (!title.trim()) {
      toast.error("Package title required");
      return;
    }
    if (validRows.length === 0) {
      toast.error("Add at least one part with a title or part number");
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase as any).rpc("create_package_with_items", {
      _organization_id: organization.id,
      _package: {
        title: title.trim(),
        customer_id: customerId,
        required_ship_date: shipDate || null,
        notes: notes || null,
        is_quote: isQuote,
      },
      _items: validRows.map((r) => ({
        title: r.title.trim() || r.part_number.trim(),
        part_number: r.part_number.trim() || null,
        quantity: r.quantity || "1",
        description: r.description.trim() || null,
      })),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const packageId = data as string;
    toast.success(
      `Package created with ${validRows.length} ${isQuote ? "quote" : "work order"}${
        validRows.length === 1 ? "" : "s"
      }`,
    );
    reset();
    onOpenChange(false);
    if (packageId) {
      onCreated?.(packageId);
      navigate(`/packages/${packageId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Build Package</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Package title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spindle assembly — Acme PO 4421"
                data-testid="pkg-title"
              />
            </div>
            <div>
              <Label>Customer</Label>
              <CustomerCombobox value={customerId} onChange={(c) => setCustomerId(c?.id ?? null)} />
            </div>
            <div>
              <Label>Required ship date</Label>
              <Input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                data-testid="pkg-ship-date"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Quote package</div>
                <div className="text-xs text-muted-foreground">
                  All children created as quotes; approve to convert in one click.
                </div>
              </div>
              <Switch checked={isQuote} onCheckedChange={setIsQuote} />
            </div>
          </div>

          {/* Parts table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base">Parts in this package</Label>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="w-3 h-3 mr-1" /> Add part
              </Button>
            </div>
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_80px_auto] gap-2 items-end border rounded-md p-2"
                  data-testid={`pkg-row-${idx}`}
                >
                  <div>
                    <Label className="text-xs">Title / name</Label>
                    <Input
                      value={row.title}
                      onChange={(e) => updateRow(idx, { title: e.target.value })}
                      placeholder="e.g. Spindle housing"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Part number</Label>
                    <Input
                      value={row.part_number}
                      onChange={(e) => updateRow(idx, { part_number: e.target.value })}
                      placeholder="P/N"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 1}
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Each row becomes its own work order with its own routing. Edit routing after creation
              from the package detail page.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !title.trim()} data-testid="pkg-build-submit">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Package &amp; {validRows.length || 0} {isQuote ? "Quote" : "WO"}
            {validRows.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
