import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubjectType = "talent" | "employer" | "card";

/**
 * Records a single view of a public profile/employer page/business card.
 * Best-effort, fire-and-forget — failures are silently swallowed.
 *
 * One write per page-load (deduped via in-memory set per session).
 */
const seen = new Set<string>();

export function useProfileViewTracker(subjectType: SubjectType, subjectId: string | null | undefined) {
  useEffect(() => {
    if (!subjectId) return;
    const key = `${subjectType}:${subjectId}`;
    if (seen.has(key)) return;
    seen.add(key);

    let cancelled = false;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (cancelled) return;
        await supabase.from("profile_views").insert({
          subject_type: subjectType,
          subject_id: subjectId,
          viewer_user_id: auth.user?.id ?? null,
          referrer: typeof document !== "undefined" ? document.referrer.slice(0, 512) : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 512) : null,
        });
      } catch {
        /* analytics failures must never break the page */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subjectType, subjectId]);
}
