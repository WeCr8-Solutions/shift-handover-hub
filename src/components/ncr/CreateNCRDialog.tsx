import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { validateNcrQuantity } from "@/lib/ncrUtils";
import { Loader2 } from "lucide-react";

interface CreateNCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderNumber: string;
  partNumber?: string | null;
  queueItemId: string;
  qtyOpen: number;
  operationNumbers?: string[];
  onSubmit: (input: {
    queue_item_id: string;
    work_order_number: string;
    part_number?: string;
    serial_or_lot: string;
    operation_number: string;
    defect_type: string;
    disposition: string;
    description: string;
    quantity_affected: number;
  }) => Promise<{ error: string | null }>;
}

export function CreateNCRDialog({
  open,
  onOpenChange,
  workOrderNumber,
  partNumber,
  queueItemId,
  qtyOpen,
  operationNumbers = [],
  onSubmit,
}: CreateNCRDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    serial_or_lot: "",
    operation_number: "",
    defect_type: "",
    disposition: "",
    description: "",
    quantity_affected: 1,
  });

  const handleSubmit = async () => {
    if (!form.serial_or_lot || !form.operation_number || !form.defect_type || !form.disposition || !form.description) {
      toast({ title: "Missing fields", description: "All fields are required", variant: "destructive" });
      return;
    }

    const qtyValidation = validateNcrQuantity(form.quantity_affected, qtyOpen);
    if (!qtyValidation.valid) {
      toast({ title: "Invalid quantity", description: qtyValidation.error, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await onSubmit({
      queue_item_id: queueItemId,
      work_order_number: workOrderNumber,
      part_number: partNumber || undefined,
      ...form,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "NCR Created", description: "Non-conformance report submitted for approval" });
      setForm({ serial_or_lot: "", operation_number: "", defect_type: "", disposition: "", description: "", quantity_affected: 1 });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Non-Conformance (NCR)</DialogTitle>
          <DialogDescription>
            WO: {workOrderNumber} {partNumber && `• Part: ${partNumber}`} • Open Qty: {qtyOpen}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Serial / Lot Number *</Label>
              <Input
                value={form.serial_or_lot}
                onChange={(e) => setForm({ ...form, serial_or_lot: e.target.value })}
                placeholder="Enter serial or lot"
              />
            </div>
            <div>
              <Label>Operation Number *</Label>
              {operationNumbers.length > 0 ? (
                <Select value={form.operation_number} onValueChange={(v) => setForm({ ...form, operation_number: v })}>
                  <SelectTrigger><SelectValue placeholder="Select operation" /></SelectTrigger>
                  <SelectContent>
                    {operationNumbers.map((op) => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.operation_number}
                  onChange={(e) => setForm({ ...form, operation_number: e.target.value })}
                  placeholder="e.g. OP-10"
                />
              )}
            </div>
          </div>

          <div>
            <Label>Defect Type *</Label>
            <Input
              value={form.defect_type}
              onChange={(e) => setForm({ ...form, defect_type: e.target.value })}
              placeholder="e.g. Dimensional, Surface Finish, Material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Disposition *</Label>
              <Select value={form.disposition} onValueChange={(v) => setForm({ ...form, disposition: v })}>
                <SelectTrigger><SelectValue placeholder="Select disposition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrap">Scrap</SelectItem>
                  <SelectItem value="rework">Rework</SelectItem>
                  <SelectItem value="use_as_is">Use As Is</SelectItem>
                  <SelectItem value="return_to_vendor">Return to Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity Affected *</Label>
              <Input
                type="number"
                min={1}
                max={qtyOpen}
                value={form.quantity_affected}
                onChange={(e) => setForm({ ...form, quantity_affected: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the non-conformance in detail..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit NCR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
