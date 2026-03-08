import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const loadSignedUrl = async (path: string) => {
    if (path.startsWith("http")) return path;
    const { data } = await supabase.storage
      .from("part-images")
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl || null;
  };

  // Load signed URL on mount if we have one
  const ensureUrl = async () => {
    if (!partImageUrl) return;
    if (signedUrl) return;
    setLoadingUrl(true);
    const url = await loadSignedUrl(partImageUrl);
    setSignedUrl(url);
    setLoadingUrl(false);
  };

  // Trigger load when partImageUrl is present
  if (partImageUrl && !signedUrl && !loadingUrl) {
    ensureUrl();
  }

  const handleUpload = async (file: File) => {
    if (!user || !organization) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${organization.id}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("part-images").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const result = await onUpdate(queueItemId, { part_image_url: path });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      const url = await loadSignedUrl(path);
      setSignedUrl(url);
      toast({ title: "Part image attached" });
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!partImageUrl) return;
    setRemoving(true);
    // Remove from storage
    if (!partImageUrl.startsWith("http")) {
      await supabase.storage.from("part-images").remove([partImageUrl]);
    }
    const result = await onUpdate(queueItemId, { part_image_url: null });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setSignedUrl(null);
      toast({ title: "Part image removed" });
    }
    setRemoving(false);
  };

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
            alt={partNumber ? `Part ${partNumber}` : "Part image"}
            className="w-full max-h-48 object-contain cursor-pointer"
            onClick={() => setViewOpen(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setViewOpen(true)}
            >
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
      ) : loadingUrl ? (
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

      {/* Full-size viewing dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {partNumber ? `Part ${partNumber}` : "Part Image"}
            </DialogTitle>
          </DialogHeader>
          {signedUrl && (
            <img
              src={signedUrl}
              alt={partNumber ? `Part ${partNumber}` : "Part image"}
              className="w-full max-h-[75vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
