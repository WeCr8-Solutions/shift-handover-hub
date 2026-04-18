import { useState } from "react";
import { useTrainingMedia, type TrainingMediaEntity } from "@/hooks/useTrainingMedia";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

/** Convert a YouTube watch URL to an embeddable URL */
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
  } catch {
    // not a URL
  }
  return null;
}

function isExternalUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://");
}

interface TrainingMediaProps {
  entityType: TrainingMediaEntity;
  entityId: string;
  /** Render only the first/primary item (compact mode) */
  primaryOnly?: boolean;
  className?: string;
  emptyHint?: string;
}

/**
 * Renders all media attached to a training entity.
 * - Images: <img> with alt + caption
 * - Video: <video controls preload="metadata">
 * - Audio: <audio controls> + transcript drawer
 */
export function TrainingMedia({
  entityType,
  entityId,
  primaryOnly,
  className,
  emptyHint,
}: TrainingMediaProps) {
  const { media, loading } = useTrainingMedia(entityType, entityId);
  const [openTranscriptId, setOpenTranscriptId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    );
  }

  if (!media.length) {
    if (!emptyHint) return null;
    return (
      <p className={`text-xs text-muted-foreground italic ${className ?? ""}`}>
        {emptyHint}
      </p>
    );
  }

  const items = primaryOnly
    ? [media.find((m) => m.is_primary) ?? media[0]]
    : media;

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {items.map((m) => {
        if (!m.signed_url) {
          return (
            <div
              key={m.id}
              className="text-xs text-muted-foreground border border-dashed rounded p-2"
            >
              Media unavailable
            </div>
          );
        }

        // ── External video (YouTube / other URL) ───────────────────────────
        if (m.media_type === "video" && isExternalUrl(m.signed_url)) {
          const embedUrl = toYouTubeEmbed(m.signed_url);
          return (
            <figure key={m.id} className="space-y-1">
              {embedUrl ? (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-black">
                  <iframe
                    src={embedUrl}
                    title={m.caption ?? m.alt_text ?? "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <a
                  href={m.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary underline"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {m.caption ?? m.file_name ?? m.signed_url}
                </a>
              )}
              {m.caption && (
                <figcaption className="text-xs text-muted-foreground">
                  {m.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // ── Hosted video ───────────────────────────────────────────────────
        if (m.media_type === "video") {
          return (
            <figure key={m.id} className="space-y-1">
              <video
                src={m.signed_url}
                controls
                preload="metadata"
                className="rounded-md border w-full max-h-96 bg-black"
              />
              {m.caption && (
                <figcaption className="text-xs text-muted-foreground">
                  {m.caption}
                </figcaption>
              )}
              {m.transcript && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-primary">Transcript</summary>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {m.transcript}
                  </p>
                </details>
              )}
            </figure>
          );
        }

        // ── Image (including SVG) ──────────────────────────────────────────
        if (m.media_type === "image") {
          return (
            <figure key={m.id} className="space-y-1">
              <img
                src={m.signed_url}
                alt={m.alt_text ?? m.caption ?? ""}
                loading="lazy"
                className="rounded-md border w-full max-h-[480px] object-contain bg-muted"
              />
              {m.caption && (
                <figcaption className="text-xs text-muted-foreground">
                  {m.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // ── Audio ──────────────────────────────────────────────────────────
        return (
          <div key={m.id} className="space-y-1">
            <audio src={m.signed_url} controls className="w-full" />
            {m.caption && (
              <p className="text-xs text-muted-foreground">{m.caption}</p>
            )}
            {m.transcript && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setOpenTranscriptId(openTranscriptId === m.id ? null : m.id)
                }
              >
                <FileText className="w-3 h-3 mr-1" />
                {openTranscriptId === m.id ? "Hide" : "Show"} transcript
              </Button>
            )}
            {openTranscriptId === m.id && m.transcript && (
              <p className="text-xs whitespace-pre-wrap text-muted-foreground border-l-2 pl-2">
                {m.transcript}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
