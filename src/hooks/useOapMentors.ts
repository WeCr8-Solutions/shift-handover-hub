import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export interface OapMentor {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string | null;
  designated_by: string;
  designated_at: string;
  is_active: boolean;
  notes: string | null;
}

export function useOapMentors() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const list = useQuery({
    queryKey: ["oap-mentors", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_designated_mentors")
        .select("*")
        .eq("organization_id", orgId!)
        .order("designated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OapMentor[];
    },
  });

  const designate = useMutation({
    mutationFn: async (params: { user_id: string; user_name?: string | null; notes?: string | null }) => {
      if (!orgId) throw new Error("No organization");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("oap_designated_mentors").upsert(
        {
          organization_id: orgId,
          user_id: params.user_id,
          user_name: params.user_name ?? null,
          designated_by: auth.user.id,
          notes: params.notes ?? null,
          is_active: true,
        },
        { onConflict: "organization_id,user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mentor designated");
      qc.invalidateQueries({ queryKey: ["oap-mentors", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to designate mentor"),
  });

  const setActive = useMutation({
    mutationFn: async (params: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("oap_designated_mentors")
        .update({ is_active: params.is_active })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oap-mentors", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return { mentors: list.data ?? [], isLoading: list.isLoading, designate, setActive };
}
