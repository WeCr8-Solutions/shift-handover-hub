import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SetupSheet {
  id: string;
  routing_step_id: string;
  queue_item_id: string;
  organization_id: string;
  title: string;
  sheet_type: string;
  file_url: string | null;
  file_name: string | null;
  external_link: string | null;
  description: string | null;
  revision: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useSetupSheets() {
  const { user, profile } = useAuth();
  const [sheets, setSheets] = useState<SetupSheet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSheets = useCallback(async (routingStepId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("setup_sheets")
      .select("*")
      .eq("routing_step_id", routingStepId)
      .order("created_at", { ascending: true });
    setSheets((data as SetupSheet[]) || []);
    setLoading(false);
  }, []);

  const addSheet = async (input: {
    routing_step_id: string;
    queue_item_id: string;
    organization_id: string;
    title: string;
    sheet_type?: string;
    file_url?: string;
    file_name?: string;
    external_link?: string;
    description?: string;
    revision?: string;
  }) => {
    const { error } = await supabase.from("setup_sheets").insert({
      ...input,
      sheet_type: input.sheet_type || "setup_sheet",
      uploaded_by: user?.id,
      uploaded_by_name: profile?.display_name || null,
    });
    if (!error) await fetchSheets(input.routing_step_id);
    return { error: error?.message || null };
  };

  const deleteSheet = async (sheetId: string, routingStepId: string) => {
    // Get file path before deleting row
    const sheet = sheets.find((s) => s.id === sheetId);
    const { error } = await supabase.from("setup_sheets").delete().eq("id", sheetId);
    if (!error) {
      // Clean up storage file if exists
      if (sheet?.file_url && !sheet.file_url.startsWith("http")) {
        await supabase.storage.from("setup-sheets").remove([sheet.file_url]);
      }
      await fetchSheets(routingStepId);
    }
    return { error: error?.message || null };
  };

  const uploadFile = async (
    file: File,
    orgId: string,
    userId: string
  ): Promise<{ path: string | null; error: string | null }> => {
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${orgId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error } = await supabase.storage.from("setup-sheets").upload(fileName, file);
    if (error) return { path: null, error: error.message };
    return { path: fileName, error: null };
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    if (filePath.startsWith("http")) return filePath;
    const { data } = await supabase.storage
      .from("setup-sheets")
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    return data?.signedUrl || null;
  };

  return {
    sheets,
    loading,
    fetchSheets,
    addSheet,
    deleteSheet,
    uploadFile,
    getSignedUrl,
  };
}
