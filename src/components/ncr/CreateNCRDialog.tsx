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
import { Loader2, ImagePlus, X } from "lucide-react";

interface CreateNCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderNumber: string;
  partNumber?: string | null;
  queueItemId: string;
  qtyOpen: number;
  operationNumbers?: string[];
  onUploadImage?: (file: File) => Promise<{ path: string | null; error: Error | null }>;
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
    image_urls?: string[];
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
  onUploadImage,
  onSubmit,
}: CreateNCRDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    serial_or_lot: "",
    operation_number: "",
    defect_type: "",
    disposition: "",
    description: "",
    quantity_affected: 1,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !onUploadImage) return;

    setUploadingImage(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 10MB per image", variant: "destructive" });
        continue;
      }
      const { path, error } = await onUploadImage(file);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      } else if (path) {
        setImagePaths((prev) => [...prev, path]);
        setImagePreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
      }
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImagePaths((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

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
      image_urls: imagePaths.length > 0 ? imagePaths : undefined,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "NCR Created", description: "Non-conformance report submitted for approval" });
      setForm({ serial_or_lot: "", operation_number: "", defect_type: "", disposition: "", description: "", quantity_affected: 1 });
      setImagePaths([]);
      imagePreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      setImagePreviewUrls([]);
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

          {/* Defect Photo Upload */}
          {onUploadImage && (
            <div>
              <Label>Defect Photos</Label>
              <div className="mt-1 space-y-2">
                {imagePreviewUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imagePreviewUrls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded border border-border overflow-hidden group">
                        <img src={url} alt={`Defect ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-dashed border-border rounded cursor-pointer hover:bg-accent transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  {uploadingImage ? "Uploading…" : "Attach photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
                <p className="text-[10px] text-muted-foreground">Max 10MB per image. Photos help with traceability.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || uploadingImage}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit NCR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
