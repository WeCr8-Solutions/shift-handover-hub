import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainingMediaUploader } from "@/components/training/TrainingMediaUploader";
import { MediaOverlayDisplay } from "@/components/training/MediaOverlayDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, X } from "lucide-react";
import type { TrainingMediaEntity } from "@/hooks/useTrainingMedia";

export interface OverlayValue {
  cover_media_id: string | null;
  cover_overlay_text: string | null;
  cover_overlay_opacity: number | null;
  cover_overlay_position: string | null;
  cover_overlay_text_color: string | null;
}

interface Props {
  value: OverlayValue;
  onChange: (next: OverlayValue) => void;
  /** entity_type to filter the media picker (e.g. 'oap_course', 'gca_bank') */
  entityType: TrainingMediaEntity;
  /** entity_id used when uploading a new media row */
  entityId: string;
  readOnly?: boolean;
  isPlatformAdmin?: boolean;
}

export function MediaOverlayEditor({
  value,
  onChange,
  entityType,
  entityId,
  readOnly,
  isPlatformAdmin,
}: Props) {
  const [picking, setPicking] = useState(false);

  // Show recent media for this entity so admin can pick an existing item
  const { data: recent = [], refetch } = useQuery({
    queryKey: ["overlay-media-options", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_media")
        .select("id,media_type,caption,file_name,storage_bucket")
        .eq("entity_type", entityType)
        .in("media_type", ["image", "video"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const set = (patch: Partial<OverlayValue>) => onChange({ ...value, ...patch });

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Cover media (image or video)</Label>
          {!readOnly && value.cover_media_id && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => set({ cover_media_id: null })}
            >
              <X className="w-3 h-3" /> Remove cover
            </Button>
          )}
        </div>

        {/* Live preview */}
        {value.cover_media_id ? (
          <MediaOverlayDisplay
            mediaId={value.cover_media_id}
            overlayText={value.cover_overlay_text}
            overlayOpacity={value.cover_overlay_opacity}
            overlayPosition={value.cover_overlay_position}
            overlayTextColor={value.cover_overlay_text_color}
            aspect="16/9"
          />
        ) : (
          <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
            No cover selected. Pick existing media or upload below.
          </div>
        )}

        {/* Picker */}
        {!readOnly && (
          <div className="space-y-2">
            <Label className="text-xs">Select existing media</Label>
            <Select
              value={value.cover_media_id ?? ""}
              onValueChange={(v) => set({ cover_media_id: v || null })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="-- choose --" />
              </SelectTrigger>
              <SelectContent>
                {recent.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    [{m.media_type}] {m.caption || m.file_name || m.id.slice(0, 8)}
                  </SelectItem>
                ))}
                {recent.length === 0 && (
                  <SelectItem value="__none" disabled>
                    No media uploaded yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Upload new */}
        {!readOnly && (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setPicking((s) => !s)}
            >
              <ImagePlus className="w-3 h-3" /> {picking ? "Hide uploader" : "Upload new media"}
            </Button>
            {picking && (
              <TrainingMediaUploader
                entityType={entityType}
                entityId={entityId}
                allowCanonical={isPlatformAdmin}
                onUploaded={() => {
                  refetch();
                  setPicking(false);
                }}
              />
            )}
          </div>
        )}

        {/* Overlay controls */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="col-span-2">
            <Label className="text-xs">Overlay text</Label>
            <Input
              className="h-8"
              value={value.cover_overlay_text ?? ""}
              onChange={(e) => set({ cover_overlay_text: e.target.value || null })}
              disabled={readOnly}
              placeholder="e.g. OAP §1 — Safety"
            />
          </div>
          <div>
            <Label className="text-xs">Position</Label>
            <Select
              value={value.cover_overlay_position ?? "center"}
              onValueChange={(v) => set({ cover_overlay_position: v })}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[
                  "top-left", "top", "top-right",
                  "center",
                  "bottom-left", "bottom", "bottom-right",
                ].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Text color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={value.cover_overlay_text_color ?? "#ffffff"}
                onChange={(e) => set({ cover_overlay_text_color: e.target.value })}
                disabled={readOnly}
                className="h-8 w-14 p-1"
              />
              <Input
                value={value.cover_overlay_text_color ?? ""}
                onChange={(e) => set({ cover_overlay_text_color: e.target.value || null })}
                disabled={readOnly}
                className="h-8"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">
              Scrim opacity ({((value.cover_overlay_opacity ?? 0.45) * 100).toFixed(0)}%)
            </Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[value.cover_overlay_opacity ?? 0.45]}
              onValueChange={([v]) => set({ cover_overlay_opacity: v })}
              disabled={readOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
