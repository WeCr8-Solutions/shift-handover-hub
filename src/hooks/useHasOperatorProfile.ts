/**
 * Lightweight check: does the current user have an operator (talent) profile?
 * Used by navigation to decide whether to surface Talent Network dashboard links.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHasOperatorProfile() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["has-operator-profile", user?.id || "none"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operator_profiles")
        .select("id, public_username")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    hasProfile: !!data,
    publicUsername: data?.public_username ?? null,
    loading: isLoading,
  };
}
