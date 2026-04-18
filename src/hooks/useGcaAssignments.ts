import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export interface GcaAssignment {
  id: string;
  organization_id: string;
  user_id: string;
  bank_id: string;
  assigned_by: string;
  assigned_by_name: string | null;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface GcaBank {
  id: string;
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
}

export function useGcaBanks() {
  return useQuery({
    queryKey: ["gca-banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .select("id, slug, title, topic, difficulty, is_published")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GcaBank[];
    },
  });
}

export function useGcaAssignments() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["gca-assignments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_assignments")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GcaAssignment[];
    },
  });

  const assign = useMutation({
    mutationFn: async (params: {
      user_id: string;
      bank_id: string;
      due_at?: string | null;
      notes?: string | null;
    }) => {
      if (!orgId) throw new Error("No organization");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      // Try to get a friendly name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      const { error } = await supabase.from("gca_assignments").upsert(
        {
          organization_id: orgId,
          user_id: params.user_id,
          bank_id: params.bank_id,
          assigned_by: auth.user.id,
          assigned_by_name: profile?.display_name ?? auth.user.email ?? null,
          due_at: params.due_at ?? null,
          notes: params.notes ?? null,
          status: "assigned",
        },
        { onConflict: "organization_id,user_id,bank_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("GCA assignment created");
      qc.invalidateQueries({ queryKey: ["gca-assignments", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to assign"),
  });

  const updateStatus = useMutation({
    mutationFn: async (params: { id: string; status: GcaAssignment["status"] }) => {
      const patch: Partial<GcaAssignment> = { status: params.status };
      if (params.status === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("gca_assignments")
        .update(patch)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gca-assignments", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gca_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment removed");
      qc.invalidateQueries({ queryKey: ["gca-assignments", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  return {
    assignments: list.data ?? [],
    isLoading: list.isLoading,
    assign,
    updateStatus,
    remove,
  };
}
