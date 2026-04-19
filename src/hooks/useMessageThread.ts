import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ThreadReply {
  id: string;
  request_id: string;
  sender_user_id: string;
  sender_role: "employer" | "candidate";
  body: string;
  created_at: string;
}

/**
 * Loads + subscribes to talent_message_replies for one talent_contact_request.
 * Both employer and candidate sides use this hook — RLS filters on the server.
 */
export function useMessageThread(requestId: string | null, senderRole: "employer" | "candidate") {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    if (!requestId) {
      setReplies([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("talent_message_replies")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (!error) setReplies((data as ThreadReply[] | null) ?? []);
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    refresh();
    if (!requestId) return;
    const channel = supabase
      .channel(`thread-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "talent_message_replies", filter: `request_id=eq.${requestId}` },
        (payload) => setReplies((prev) => [...prev, payload.new as ThreadReply])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, refresh]);

  const sendReply = useCallback(
    async (body: string) => {
      if (!requestId || !user?.id || !body.trim()) return;
      setSending(true);
      const { error } = await supabase.from("talent_message_replies").insert({
        request_id: requestId,
        sender_user_id: user.id,
        sender_role: senderRole,
        body: body.trim(),
      });
      setSending(false);
      if (error) throw error;
    },
    [requestId, user?.id, senderRole]
  );

  return { replies, loading, sending, sendReply, refresh };
}
