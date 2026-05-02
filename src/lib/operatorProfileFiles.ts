import { supabase } from "@/integrations/supabase/client";

/**
 * The `operator-profiles` storage bucket is **private**. Files are read via
 * signed URLs so unauthenticated CDN access cannot bypass the visibility gate
 * enforced by RLS. Both legacy public URLs and modern storage paths are
 * accepted; this helper normalizes either shape to a signed URL.
 *
 * @param value Either a storage path (e.g. `"<uid>/avatar/foo.png"`) or a
 *   legacy `https://<project>.supabase.co/storage/v1/object/public/...` URL
 *   left in the database from when the bucket was public.
 * @param expiresIn Signed-URL TTL in seconds (default 24h).
 * @returns Signed URL or `null` if no value / signing failed.
 */
export async function getOperatorProfileSignedUrl(
  value: string | null | undefined,
  expiresIn = 60 * 60 * 24,
): Promise<string | null> {
  if (!value) return null;
  const path = extractOperatorProfilesPath(value);
  if (!path) return null;
  const { data } = await supabase.storage
    .from("operator-profiles")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** Pull the bucket-relative path out of either a path or a legacy public URL. */
export function extractOperatorProfilesPath(value: string): string | null {
  if (!value.startsWith("http")) return value;
  const marker = "/operator-profiles/";
  const i = value.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(value.slice(i + marker.length).split("?")[0]);
}
