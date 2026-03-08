import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePartImage } from "@/hooks/use-part-image";
import { Camera, Upload, Trash2, Loader2, Maximize2 } from "lucide-react";

interface PartImageSectionProps {
  queueItemId: string;
  partImageUrl: string | null | undefined;
  partNumber: string | null | undefined;
  canEdit: boolean;
  onUpdate: (id: string, input: { part_image_url: string | null }) => Promise<{ error: string | null }>;
}

export function PartImageSection({
  queueItemId,
  partImageUrl,
  partNumber,
  canEdit,
  onUpdate,
}: PartImageSectionProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { signedUrl, loading, uploading, removing, upload, remove } =
    usePartImage(queueItemId, partImageUrl, onUpdate);

  const handleUpload = async (file: File) => {
    const result = await upload(file);
    if (result.error) {
      toast({ title: "Upload failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Part image attached" });
    }
  };

  const handleRemove = async () => {
    const result = await remove();
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Part image removed" });
    }
  };

  const altText = partNumber ? `Part ${partNumber}` : "Part image";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" />
          Part Image
        </label>
        {canEdit && !partImageUrl && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
          </Button>
        )}
      </div>

      {signedUrl ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted/20">
          <img
            src={signedUrl}
            alt={altText}
            className="w-full max-h-48 object-contain cursor-pointer"
            onClick={() => setViewOpen(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button variant="secondary" size="sm" className="gap-1 text-xs" onClick={() => setViewOpen(true)}>
              <Maximize2 className="w-3 h-3" /> View Full Size
            </Button>
          </div>
          {canEdit && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </Button>
          )}
        </div>
      ) : loading ? (
        <div className="h-24 rounded-lg border bg-muted/20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="h-24 rounded-lg border border-dashed bg-muted/10 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
          <Camera className="w-5 h-5" />
          No part image attached
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">{partNumber ? `Part ${partNumber}` : "Part Image"}</DialogTitle>
          </DialogHeader>
          {signedUrl && (
            <img src={signedUrl} alt={altText} className="w-full max-h-[75vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
