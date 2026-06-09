import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useConciergeUploads, type UploadedConciergeDoc, type UploadedDocCategory } from "@/hooks/useConciergeUploads";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string | null;
  engagementId?: string | null;
  defaultCategory?: UploadedDocCategory;
  /** When provided, the upload is treated as a new version replacing this doc. */
  supersedes?: UploadedConciergeDoc | null;
}

const CATEGORY_LABEL: Record<UploadedDocCategory, string> = {
  manual: "Machine Manual",
  sop: "SOP / Procedure",
  reference: "Reference Document",
};

export function UploadDocumentDialog({ open, onOpenChange, orgId, engagementId, defaultCategory = "manual", supersedes }: Props) {
  const { upload } = useConciergeUploads(orgId);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(supersedes?.title ?? "");
  const [description, setDescription] = useState(supersedes?.description ?? "");
  const [category, setCategory] = useState<UploadedDocCategory>(supersedes?.category ?? defaultCategory);
  const [tagsRaw, setTagsRaw] = useState((supersedes?.tags ?? []).join(", "));

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setTagsRaw("");
    setCategory(defaultCategory);
  }

  async function handleSubmit() {
    if (!orgId) return toast.error("No organization selected");
    if (!file) return toast.error("Choose a file to upload");
    if (!title.trim()) return toast.error("Title is required");

    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await upload.mutateAsync({
        file,
        category,
        title,
        description,
        tags,
        engagementId: engagementId ?? null,
        supersedesId: supersedes?.id ?? null,
      });
      reset();
      onOpenChange(false);
    } catch {
      /* toast handled inside the hook */
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {supersedes ? `Upload new version — ${supersedes.title}` : "Upload document"}
          </DialogTitle>
          <DialogDescription>
            Stored privately for this organization. Org members can view; admins can edit or delete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as UploadedDocCategory)} disabled={!!supersedes}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as UploadedDocCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-title">Title *</Label>
            <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Haas VF-2 Operator Manual" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-desc">Description</Label>
            <Textarea id="upload-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-tags">Tags (comma-separated)</Label>
            <Input id="upload-tags" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="haas, vf-2, programming" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-file">File *</Label>
            <Input id="upload-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.csv,.png,.jpg,.jpeg,.svg" />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={upload.isPending || !file} className="gap-2">
            {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {supersedes ? "Save new version" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
