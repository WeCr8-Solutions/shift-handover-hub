import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CampaignAssetKind =
  | "flyer_image"
  | "mailing_list_xlsx"
  | "document"
  | "other";

export interface CampaignMarketingAsset {
  id: string;
  campaign_id: string;
  kind: CampaignAssetKind;
  title: string;
  notes: string | null;
  used_on: string | null;
  zone_number: number | null;
  utm_content: string | null;
  utm_target_url: string | null;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "campaign-marketing";

export function useCampaignMarketingAssets(campaignId: string | null) {
  const [assets, setAssets] = useState<CampaignMarketingAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!campaignId) {
      setAssets([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("campaign_marketing_assets" as never)
      .select("*")
      .eq("campaign_id" as never, campaignId as never)
      .order("created_at" as never, { ascending: false }) as unknown as {
        data: CampaignMarketingAsset[] | null;
      };
    setAssets(data ?? []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  async function signedUrl(path: string, expiresInSec = 3600): Promise<string | null> {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSec);
    return data?.signedUrl ?? null;
  }

  async function uploadAsset(params: {
    file: File | Blob;
    filename: string;
    kind: CampaignAssetKind;
    title: string;
    notes?: string;
    usedOn?: string | null;
    zoneNumber?: number | null;
    utmContent?: string | null;
    utmTargetUrl?: string | null;
  }) {
    if (!campaignId) throw new Error("No campaign selected");
    const user = (await supabase.auth.getUser()).data.user;
    const safeName = params.filename.replace(/[^\w.\-]+/g, "_");
    const path = `${campaignId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, params.file, {
        contentType: (params.file as File).type || undefined,
        upsert: false,
      });
    if (upErr) throw upErr;

    const { error: insErr } = await (supabase
      .from("campaign_marketing_assets" as never)
      .insert({
        campaign_id: campaignId,
        kind: params.kind,
        title: params.title,
        notes: params.notes ?? null,
        used_on: params.usedOn ?? null,
        zone_number: params.zoneNumber ?? null,
        utm_content: params.utmContent ?? null,
        utm_target_url: params.utmTargetUrl ?? null,
        storage_path: path,
        mime_type: (params.file as File).type || null,
        byte_size: (params.file as File).size ?? null,
        uploaded_by: user?.id ?? null,
      } as never) as unknown as Promise<{ error: unknown }>);
    if (insErr) throw insErr;
    await load();
  }

  async function updateAsset(id: string, patch: Partial<CampaignMarketingAsset>) {
    const { error } = await (supabase
      .from("campaign_marketing_assets" as never)
      .update(patch as never)
      .eq("id" as never, id as never) as unknown as Promise<{ error: unknown }>);
    if (error) throw error;
    await load();
  }

  async function deleteAsset(asset: CampaignMarketingAsset) {
    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    const { error } = await (supabase
      .from("campaign_marketing_assets" as never)
      .delete()
      .eq("id" as never, asset.id as never) as unknown as Promise<{ error: unknown }>);
    if (error) throw error;
    await load();
  }

  return { assets, loading, reload: load, uploadAsset, updateAsset, deleteAsset, signedUrl };
}
