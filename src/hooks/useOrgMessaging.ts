import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

export interface OrgConnection {
  id: string;
  organization_id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMessage {
  id: string;
  organization_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ConnectionPartner {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: OrgConnection["status"];
  connection_id: string;
  is_requester: boolean;
}

/** All connections (incoming + outgoing) for the current user in the active org. */
export function useOrgConnections() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [connections, setConnections] = useState<OrgConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id || !organization?.id) {
      setConnections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("org_connections")
      .select("*")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false });
    setConnections((data as OrgConnection[] | null) ?? []);
    setLoading(false);
  }, [user?.id, organization?.id]);

  useEffect(() => {
    refresh();
    if (!user?.id) return;
    const channel = supabase
      .channel(`org-conn-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_connections" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, user?.id]);

  const requestConnection = useCallback(
    async (recipientId: string, message?: string) => {
      if (!user?.id || !organization?.id) throw new Error("Missing context");
      const { error } = await supabase.from("org_connections").insert({
        organization_id: organization.id,
        requester_id: user.id,
        recipient_id: recipientId,
        message: message?.trim() || null,
      });
      if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
      await refresh();
    },
    [user?.id, organization?.id, refresh]
  );

  const respondConnection = useCallback(
    async (id: string, status: "accepted" | "declined" | "blocked") => {
      const { error } = await supabase
        .from("org_connections")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  return { connections, loading, refresh, requestConnection, respondConnection };
}

/** All DMs for the current user in the active org. */
export function useOrgMessages() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [messages, setMessages] = useState<OrgMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id || !organization?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("org_messages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true });
    setMessages((data as OrgMessage[] | null) ?? []);
    setLoading(false);
  }, [user?.id, organization?.id]);

  useEffect(() => {
    refresh();
    if (!user?.id) return;
    const channel = supabase
      .channel(`org-msg-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_messages" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, user?.id]);

  const sendMessage = useCallback(
    async (recipientId: string, body: string) => {
      if (!user?.id || !organization?.id || !body.trim()) return;
      const { error } = await supabase.from("org_messages").insert({
        organization_id: organization.id,
        sender_id: user.id,
        recipient_id: recipientId,
        body: body.trim(),
      });
      if (error) throw error;
    },
    [user?.id, organization?.id]
  );

  const markRead = useCallback(
    async (messageId: string) => {
      const { error } = await supabase
        .from("org_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);
      if (error) throw error;
    },
    []
  );

  return { messages, loading, refresh, sendMessage, markRead };
}

/** Live count of unread DMs for the current user across active org. */
export function useOrgMessagesUnread() {
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
        .from("org_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);
      if (!cancelled) setCount(c ?? 0);
    };
    load();
    const channel = supabase
      .channel(`org-msg-unread-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_messages", filter: `recipient_id=eq.${user.id}` },
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
