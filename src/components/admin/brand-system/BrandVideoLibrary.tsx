/**
 * BrandVideoLibrary — admin-only brand video manager.
 *
 * Modular video section for the Brand System panel. Accepts YouTube,
 * Vimeo, and direct MP4 URLs. Stores entries in localStorage so admins
 * can curate previews without a migration; this can later be promoted
 * to a Supabase table without changing the UI surface.
 *
 * Storage key: jobline.brand-videos.v1
 */

import { useEffect, useMemo, useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ExternalLink, Film, Youtube } from "lucide-react";
import { toast } from "sonner";

export type BrandVideoCategory = "product" | "talent" | "oap" | "gca" | "promo" | "training";

export interface BrandVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  category: BrandVideoCategory;
  addedAt: string;
}

const STORAGE_KEY = "jobline.brand-videos.v1";

const CATEGORY_LABELS: Record<BrandVideoCategory, string> = {
  product: "Product",
  talent: "Talent",
  oap: "OAP",
  gca: "G-Code Academy",
  promo: "Promo / Campaign",
  training: "Training",
};

const SEED_VIDEOS: BrandVideo[] = [];

function loadVideos(): BrandVideo[] {
  if (typeof window === "undefined") return SEED_VIDEOS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_VIDEOS;
    const parsed = JSON.parse(raw) as BrandVideo[];
    return Array.isArray(parsed) ? parsed : SEED_VIDEOS;
  } catch {
    return SEED_VIDEOS;
  }
}

function saveVideos(list: BrandVideo[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Returns an embeddable iframe src for YouTube/Vimeo, or null for direct files. */
function getEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

function VideoPreview({ url, title }: { url: string; title: string }) {
  const embed = getEmbedSrc(url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title}
        className="w-full aspect-video rounded-md border border-border bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (isDirectVideo(url)) {
    return (
      <video
        controls
        src={url}
        className="w-full aspect-video rounded-md border border-border bg-black"
      />
    );
  }
  return (
    <div className="w-full aspect-video rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
      <Film className="w-8 h-8" />
      <p className="text-xs">Unrecognized URL — preview unavailable</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-primary inline-flex items-center gap-1"
      >
        Open externally <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

export function BrandVideoLibrary() {
  const [videos, setVideos] = useState<BrandVideo[]>(SEED_VIDEOS);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<BrandVideoCategory>("product");  const [filter, setFilter] = useUrlState<BrandVideoCategory | "all">("f", "all");

  useEffect(() => {
    setVideos(loadVideos());
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? videos : videos.filter((v) => v.category === filter)),
    [videos, filter],
  );

  function addVideo() {
    if (!title.trim() || !url.trim()) {
      toast.error("Title and URL are required.");
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      toast.error("URL is not valid.");
      return;
    }
    const next: BrandVideo = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      category,
      addedAt: new Date().toISOString(),
    };
    const updated = [next, ...videos];
    setVideos(updated);
    saveVideos(updated);
    setTitle("");
    setDescription("");
    setUrl("");
    toast.success("Video added.");
  }

  function removeVideo(id: string) {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    saveVideos(updated);
    toast.success("Video removed.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="w-4 h-4" />
            Brand Video Library
          </CardTitle>
          <CardDescription>
            Curate YouTube, Vimeo, or hosted MP4 videos for marketing use. Stored locally for now;
            embed previews work without a deploy.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bv-title">Title</Label>
            <Input
              id="bv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JobLine.ai — 60-second product tour"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bv-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as BrandVideoCategory)}>
              <SelectTrigger id="bv-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as BrandVideoCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bv-url">URL</Label>
            <Input
              id="bv-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://cdn/.../clip.mp4"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bv-desc">Description</Label>
            <Textarea
              id="bv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where this video should be used and why."
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={addVideo} className="gap-2">
              <Plus className="w-4 h-4" />
              Add video
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Filter:</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(Object.keys(CATEGORY_LABELS) as BrandVideoCategory[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-xs">
          {visible.length} {visible.length === 1 ? "video" : "videos"}
        </Badge>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Youtube className="w-8 h-8 opacity-50" />
            No videos yet. Paste a YouTube, Vimeo, or MP4 URL above to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm leading-tight truncate">{v.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABELS[v.category]}
                      </Badge>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-muted-foreground inline-flex items-center gap-1 hover:text-primary"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeVideo(v.id)}
                    aria-label="Remove video"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <VideoPreview url={v.url} title={v.title} />
                {v.description && (
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
