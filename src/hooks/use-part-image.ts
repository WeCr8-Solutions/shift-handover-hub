import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

const BUCKET = "part-images";

export function usePartImage(
  queueItemId: string,
  partImageUrl: string | null | undefined,
  onUpdate: (id: string, input: { part_image_url: string | null }) => Promise<{ error: string | null }>
) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const resolveUrl = useCallback(async (path: string) => {
    if (path.startsWith("http")) return path;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return data?.signedUrl || null;
  }, []);

  // Auto-resolve signed URL when partImageUrl changes
  useEffect(() => {
    if (!partImageUrl) {
      setSignedUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    resolveUrl(partImageUrl).then((url) => {
      if (!cancelled) {
        setSignedUrl(url);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [partImageUrl, resolveUrl]);

  const upload = useCallback(async (file: File): Promise<{ error: string | null }> => {
    if (!user || !organization) return { error: "Not authenticated" };
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${organization.id}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadErr) {
      setUploading(false);
      return { error: uploadErr.message };
    }
    const result = await onUpdate(queueItemId, { part_image_url: path });
    if (!result.error) {
      const url = await resolveUrl(path);
      setSignedUrl(url);
    }
    setUploading(false);
    return result;
  }, [user, organization, queueItemId, onUpdate, resolveUrl]);

  const remove = useCallback(async (): Promise<{ error: string | null }> => {
    if (!partImageUrl) return { error: null };
    setRemoving(true);
    if (!partImageUrl.startsWith("http")) {
      await supabase.storage.from(BUCKET).remove([partImageUrl]);
    }
    const result = await onUpdate(queueItemId, { part_image_url: null });
    if (!result.error) setSignedUrl(null);
    setRemoving(false);
    return result;
  }, [partImageUrl, queueItemId, onUpdate]);

  return { signedUrl, loading, uploading, removing, upload, remove };
}
