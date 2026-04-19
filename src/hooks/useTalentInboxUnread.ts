import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Count of pending recruiter messages directed at the current user. */
export function useTalentInboxUnread() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { count: c } = await supabase
        .from("talent_contact_requests")
        .select("id", { count: "exact", head: true })
        .eq("candidate_user_id", user.id)
        .eq("candidate_response", "pending");
      if (!cancelled) setCount(c ?? 0);
    };
    load();

    const channel = supabase
      .channel(`talent-inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "talent_contact_requests", filter: `candidate_user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return count;
}
