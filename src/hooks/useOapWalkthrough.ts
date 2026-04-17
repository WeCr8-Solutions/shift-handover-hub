import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export interface WalkthroughSection {
  id: string;
  section_key: string;
  section_order: number;
  title: string;
  description: string | null;
}

export interface WalkthroughItem {
  id: string;
  section_id: string;
  organization_id: string | null;
  item_order: number;
  title: string;
  description: string | null;
  instructions: string | null;
  is_required: boolean;
  is_active: boolean;
}

export interface WalkthroughSession {
  id: string;
  organization_id: string;
  operator_id: string;
  operator_name: string | null;
  primary_mentor_id: string | null;
  primary_mentor_name: string | null;
  status: string;
  current_section_order: number;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export type CheckoffResult = "pass" | "needs_practice" | "fail";

export interface WalkthroughCheckoff {
  id: string;
  session_id: string;
  organization_id: string;
  section_id: string;
  item_id: string;
  result: CheckoffResult;
  notes: string | null;
  mentor_id: string;
  mentor_name: string;
  mentor_signature: string;
  signed_at: string;
}

export function useWalkthroughCatalog() {
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const sections = useQuery({
    queryKey: ["oap-wt-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_walkthrough_sections")
        .select("*")
        .order("section_order");
      if (error) throw error;
      return (data ?? []) as WalkthroughSection[];
    },
  });

  const items = useQuery({
    queryKey: ["oap-wt-items", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_walkthrough_items")
        .select("*")
        .or(`organization_id.is.null,organization_id.eq.${orgId}`)
        .eq("is_active", true)
        .order("item_order");
      if (error) throw error;
      return (data ?? []) as WalkthroughItem[];
    },
  });

  return { sections: sections.data ?? [], items: items.data ?? [], isLoading: sections.isLoading || items.isLoading };
}

export function useWalkthroughSessions() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const list = useQuery({
    queryKey: ["oap-wt-sessions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_walkthrough_sessions")
        .select("*")
        .eq("organization_id", orgId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WalkthroughSession[];
    },
  });

  const start = useMutation({
    mutationFn: async (params: { operator_id: string; operator_name?: string | null }) => {
      if (!orgId) throw new Error("No organization");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("oap_walkthrough_sessions")
        .insert({
          organization_id: orgId,
          operator_id: params.operator_id,
          operator_name: params.operator_name ?? null,
          primary_mentor_id: auth.user.id,
          primary_mentor_name: auth.user.email ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as WalkthroughSession;
    },
    onSuccess: () => {
      toast.success("Walkthrough started");
      qc.invalidateQueries({ queryKey: ["oap-wt-sessions", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to start walkthrough"),
  });

  const complete = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("oap_walkthrough_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Walkthrough completed");
      qc.invalidateQueries({ queryKey: ["oap-wt-sessions", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Complete failed"),
  });

  return { sessions: list.data ?? [], isLoading: list.isLoading, start, complete };
}

export function useSessionCheckoffs(sessionId: string | null) {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const list = useQuery({
    queryKey: ["oap-wt-checkoffs", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_walkthrough_checkoffs")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data ?? []) as WalkthroughCheckoff[];
    },
  });

  const checkoff = useMutation({
    mutationFn: async (params: {
      section_id: string;
      item_id: string;
      result: CheckoffResult;
      notes?: string | null;
      mentor_signature: string;
    }) => {
      if (!orgId || !sessionId) throw new Error("Missing context");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("oap_walkthrough_checkoffs").upsert(
        {
          session_id: sessionId,
          organization_id: orgId,
          section_id: params.section_id,
          item_id: params.item_id,
          result: params.result,
          notes: params.notes ?? null,
          mentor_id: auth.user.id,
          mentor_name: auth.user.email ?? "mentor",
          mentor_signature: params.mentor_signature,
        },
        { onConflict: "session_id,item_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oap-wt-checkoffs", sessionId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Check-off failed"),
  });

  return { checkoffs: list.data ?? [], isLoading: list.isLoading, checkoff };
}
