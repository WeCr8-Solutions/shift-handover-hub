import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CertificateProgram } from "@/lib/certificates";

export type CertificateVariant = "diploma" | "digital";
export type BorderStyle = "ornate" | "minimal" | "modern";

export interface CertificateTemplate {
  id: string;
  program: CertificateProgram;
  variant: CertificateVariant;
  name: string;
  is_active: boolean;
  is_canonical: boolean;
  organization_id: string | null;
  seal_logo_path: string | null;
  background_watermark_path: string | null;
  signature_default_path: string | null;
  accent_color_hex: string | null;
  border_style: BorderStyle | null;
  header_text: string | null;
  footer_text: string | null;
  font_family_serif: string | null;
  font_family_sans: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "certificate-templates";

function publicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useCertificateTemplates(orgId?: string | null) {
  return useQuery({
    queryKey: ["certificate-templates", orgId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("certificate_templates").select("*").order("created_at", { ascending: false });
      if (orgId) {
        q = q.or(`is_canonical.eq.true,organization_id.eq.${orgId}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CertificateTemplate[];
    },
  });
}

/**
 * Fetch the active template for a program/variant — org override wins,
 * canonical falls back. Returns null if no template configured (use built-in defaults).
 */
export function useActiveTemplate(
  program: CertificateProgram,
  variant: CertificateVariant,
  orgId?: string | null
) {
  return useQuery({
    queryKey: ["certificate-template-active", program, variant, orgId ?? "canonical"],
    queryFn: async () => {
      // Try org-specific first
      if (orgId) {
        const { data: orgRow } = await supabase
          .from("certificate_templates")
          .select("*")
          .eq("program", program)
          .eq("variant", variant)
          .eq("organization_id", orgId)
          .eq("is_active", true)
          .maybeSingle();
        if (orgRow) return orgRow as CertificateTemplate;
      }
      // Fall back to canonical
      const { data: canonical } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("program", program)
        .eq("variant", variant)
        .eq("is_canonical", true)
        .eq("is_active", true)
        .maybeSingle();
      return (canonical as CertificateTemplate | null) ?? null;
    },
  });
}

export function useCertTemplateMutations() {
  const qc = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (t: Partial<CertificateTemplate> & { program: CertificateProgram; variant: CertificateVariant; name: string }) => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .upsert(t as any, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificate-templates"] });
      qc.invalidateQueries({ queryKey: ["certificate-template-active"] });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificate-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, program, variant, organizationId }: {
      id: string;
      program: CertificateProgram;
      variant: CertificateVariant;
      organizationId: string | null;
    }) => {
      // Deactivate siblings in same scope
      const scopeFilter = organizationId
        ? { organization_id: organizationId }
        : { is_canonical: true };
      await supabase
        .from("certificate_templates")
        .update({ is_active: false })
        .eq("program", program)
        .eq("variant", variant)
        .match(scopeFilter as any);
      const { error } = await supabase
        .from("certificate_templates")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificate-templates"] });
      qc.invalidateQueries({ queryKey: ["certificate-template-active"] });
      toast.success("Activated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAsset = useMutation({
    mutationFn: async ({ file, kind, scope }: {
      file: File;
      kind: "seal" | "watermark" | "signature";
      scope: { canonical: true } | { organizationId: string };
    }) => {
      const folder = "canonical" in scope ? "canonical" : `org-${scope.organizationId}`;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${folder}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      return path;
    },
    onError: (e: Error) => toast.error(`Upload failed: ${e.message}`),
  });

  return { upsert, remove, setActive, uploadAsset };
}

export { publicUrl as templateAssetUrl };
