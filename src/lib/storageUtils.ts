import { supabase } from "@/integrations/supabase/client";

type BucketName = "ncr-attachments" | "handoff-attachments" | "performance-updates" | "part-images" | "setup-sheets";

/**
 * Upload a file to an org-scoped storage bucket.
 * Path: {org_id}/{user_id}/{timestamp}-{random}.{ext}
 */
export async function uploadOrgScopedFile(
  bucket: BucketName,
  file: File,
  orgId: string,
  userId: string
): Promise<{ path: string | null; error: Error | null }> {
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `${orgId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) return { path: null, error };
  return { path: fileName, error: null };
}

/**
 * Get signed URLs for an array of file paths in a bucket.
 * Handles legacy full URLs (returns as-is) and file paths.
 */
export async function getSignedUrls(
  bucket: BucketName,
  filePaths: string[],
  expiresIn = 60 * 60 * 24 // 24h
): Promise<string[]> {
  if (!filePaths.length) return [];

  const results = await Promise.all(
    filePaths.map(async (path) => {
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      return data?.signedUrl || path;
    })
  );
  return results;
}
