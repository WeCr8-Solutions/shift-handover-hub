import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  single: 25,
  team: 100,
  enterprise: -1, // unlimited
};

export function useAiChatUsage(organizationId: string | null) {
  return useQuery({
    queryKey: ["ai-chat-usage", organizationId],
    enabled: !!organizationId,
    refetchInterval: 30_000, // refresh every 30s
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);

      // Fetch usage and entitlements in parallel
      const [usageRes, entRes] = await Promise.all([
        supabase
          .from("ai_chat_usage" as any)
          .select("message_count")
          .eq("organization_id", organizationId!)
          .eq("usage_date", today)
          .maybeSingle(),
        supabase
          .from("entitlements")
          .select("plan")
          .eq("organization_id", organizationId!)
          .maybeSingle(),
      ]);

      const count = (usageRes.data as any)?.message_count ?? 0;
      const plan = (entRes.data as any)?.plan ?? "free";
      const dailyLimit = PLAN_LIMITS[plan] ?? 5;

      return {
        count: count as number,
        dailyLimit,
        plan: plan as string,
        limitReached: dailyLimit > 0 && count >= dailyLimit,
        remaining: dailyLimit < 0 ? Infinity : Math.max(0, dailyLimit - count),
      };
    },
  });
}
