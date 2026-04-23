import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MediaOverlayProps {
  mediaId: string | null | undefined;
  overlayText?: string | null;
  overlayOpacity?: number | null;
  overlayPosition?: string | null;
  overlayTextColor?: string | null;
  className?: string;
  rounded?: boolean;
  /** Aspect ratio of the cover container. Default 16/9. */
  aspect?: string;
}

interface MediaRow {
  media_type: "image" | "audio" | "video";
  storage_bucket: string;
  storage_path: string;
  alt_text: string | null;
  caption: string | null;
}

function isExternalUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://");
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1&mute=1&loop=1&controls=0&playlist=${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&controls=0&playlist=${id}`;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const POSITION_CLASS: Record<string, string> = {
  "top-left": "items-start justify-start text-left",
  top: "items-start justify-center text-center",
  "top-right": "items-start justify-end text-right",
  center: "items-center justify-center text-center",
  "bottom-left": "items-end justify-start text-left",
  bottom: "items-end justify-center text-center",
  "bottom-right": "items-end justify-end text-right",
};

/**
 * Renders a cover image or video for a program (GCA bank / OAP course / lesson)
 * with a darkening scrim and overlay text. Reads the underlying training_media row
 * by id and resolves a signed URL (or external embed URL).
 */
export function MediaOverlayDisplay({
  mediaId,
  overlayText,
  overlayOpacity,
  overlayPosition,
  overlayTextColor,
  className,
  rounded = true,
  aspect = "16/9",
}: MediaOverlayProps) {
  const [row, setRow] = useState<MediaRow | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!mediaId) {
        setRow(null);
        setUrl(null);
        return;
      }
      const { data } = await supabase
        .from("training_media")
        .select("media_type,storage_bucket,storage_path,alt_text,caption")
        .eq("id", mediaId)
        .maybeSingle();
      if (cancelled || !data) return;
      const r = data as MediaRow;
      setRow(r);
      if (r.storage_bucket === "external") {
        setUrl(r.storage_path);
      } else {
        const { data: signed } = await supabase.storage
          .from(r.storage_bucket)
          .createSignedUrl(r.storage_path, 60 * 60);
        if (!cancelled) setUrl(signed?.signedUrl ?? null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  if (!mediaId || !row || !url) return null;

  const opacity = Math.max(0, Math.min(1, overlayOpacity ?? 0.45));
  const posClass = POSITION_CLASS[overlayPosition ?? "center"] ?? POSITION_CLASS.center;

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${rounded ? "rounded-md" : ""} ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    >
      {row.media_type === "image" && (
        <img
          src={url}
          alt={row.alt_text ?? overlayText ?? row.caption ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
      {row.media_type === "video" && isExternalUrl(url) && toYouTubeEmbed(url) && (
        <iframe
          src={toYouTubeEmbed(url)!}
          title={overlayText ?? row.caption ?? "Video"}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="absolute inset-0 w-full h-full pointer-events-none"
          loading="lazy"
        />
      )}
      {row.media_type === "video" && !isExternalUrl(url) && (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Darkening scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
        aria-hidden="true"
      />

      {/* Overlay text */}
      {overlayText && (
        <div className={`absolute inset-0 flex p-4 sm:p-6 pointer-events-none ${posClass}`}>
          <div
            className="font-semibold text-base sm:text-xl drop-shadow-md max-w-[90%]"
            style={{ color: overlayTextColor ?? "#ffffff" }}
          >
            {overlayText}
          </div>
        </div>
      )}
    </div>
  );
}
