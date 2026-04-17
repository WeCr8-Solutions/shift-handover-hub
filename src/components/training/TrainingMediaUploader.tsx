import { useState } from "react";
import {
  useTrainingMediaUploader,
  ACCEPTED_FILE_ACCEPT,
  detectMediaType,
  type TrainingMediaEntity,
  type TrainingMediaProgram,
} from "@/hooks/useTrainingMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  entityType: TrainingMediaEntity;
  entityId: string;
  defaultProgram?: TrainingMediaProgram;
  /** Platform admins managing canonical Jobline assets */
  allowCanonical?: boolean;
  onUploaded?: () => void;
}

export function TrainingMediaUploader({
  entityType,
  entityId,
  defaultProgram = "both",
  allowCanonical,
  onUploaded,
}: Props) {
  const { upload } = useTrainingMediaUploader();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [program, setProgram] = useState<TrainingMediaProgram>(defaultProgram);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isCanonical, setIsCanonical] = useState(false);
  const [busy, setBusy] = useState(false);

  const detected = file ? detectMediaType(file.type) : null;

  const handleUpload = async () => {
    if (!file) return;
    if (!detected) {
      toast.error("Unsupported file type. Use AVIF/GIF/JPEG/PNG, MP3/M4A, MP4/WebM.");
      return;
    }
    setBusy(true);
    try {
      await upload({
        file,
        entityType,
        entityId,
        program,
        visibility,
        caption: caption || undefined,
        altText: altText || undefined,
        transcript: transcript || undefined,
        isCanonical,
      });
      toast.success("Media uploaded");
      setFile(null);
      setCaption("");
      setAltText("");
      setTranscript("");
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border rounded-md p-3 bg-card">
      <div className="space-y-1">
        <Label htmlFor="tm-file">File (image / audio / video)</Label>
        <Input
          id="tm-file"
          type="file"
          accept={ACCEPTED_FILE_ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} • {(file.size / 1024).toFixed(0)} KB •{" "}
            {detected ?? "unsupported"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Program</Label>
          <Select value={program} onValueChange={(v) => setProgram(v as TrainingMediaProgram)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both (GCA + OAP)</SelectItem>
              <SelectItem value="gca">GCA only</SelectItem>
              <SelectItem value="oap">OAP only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public bucket (signed URL)</SelectItem>
              <SelectItem value="private">Private (org only)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="tm-caption">Caption</Label>
        <Input
          id="tm-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Short description shown beneath the media"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tm-alt">Alt text (images)</Label>
        <Input
          id="tm-alt"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Accessible description for screen readers"
        />
      </div>
      {(detected === "audio" || detected === "video") && (
        <div className="space-y-1">
          <Label htmlFor="tm-transcript">Transcript (audio/video)</Label>
          <Textarea
            id="tm-transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
        </div>
      )}

      {allowCanonical && (
        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <Label className="text-sm">Canonical Jobline asset</Label>
            <p className="text-xs text-muted-foreground">
              Available to every organization. Platform admins only.
            </p>
          </div>
          <Switch checked={isCanonical} onCheckedChange={setIsCanonical} />
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        Upload media
      </Button>
    </div>
  );
}
