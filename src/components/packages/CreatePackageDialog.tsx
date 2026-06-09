import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CustomerCombobox } from "@/components/queue/CustomerCombobox";
import { usePackages, type WorkOrderPackage } from "@/hooks/usePackages";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (pkg: WorkOrderPackage) => void;
}

export function CreatePackageDialog({ open, onOpenChange, onCreated }: Props) {
  const { createPackage } = usePackages();
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [shipDate, setShipDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isQuote, setIsQuote] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    const res = await createPackage({
      title: title.trim(),
      customer_id: customerId,
      required_ship_date: shipDate || null,
      notes: notes || null,
      is_quote: isQuote,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Package ${res.data?.package_number} created`);
    setTitle("");
    setCustomerId(null);
    setShipDate("");
    setNotes("");
    setIsQuote(false);
    onOpenChange(false);
    if (res.data) onCreated?.(res.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Package title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme assembly #4 — Rev B"
            />
          </div>
          <div>
            <Label>Customer</Label>
            <CustomerCombobox value={customerId} onChange={(c) => setCustomerId(c?.id ?? null)} />
          </div>
          <div>
            <Label>Required ship date</Label>
            <Input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Package of quotes</div>
              <div className="text-xs text-muted-foreground">
                On approval, all child quotes convert to work orders together.
              </div>
            </div>
            <Switch checked={isQuote} onCheckedChange={setIsQuote} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !title.trim()}>
            Create Package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
