import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceNotifications } from "@/hooks/useDeviceNotifications";

/**
 * Mount once (e.g. inside <Header />). Subscribes to the user's relevant
 * Realtime channels and dispatches foreground device notifications.
 *
 * Currently wired:
 *  - Org DMs (org_messages → recipient_id=auth.uid)
 *  - Recruiter outreach (talent_contact_requests → candidate_user_id=auth.uid)
 *
 * Smart Alerts and System Updates are surfaced via their own panels;
 * we can add dedicated channels here later without touching callers.
 */
export function DeviceNotificationDispatcher() {
  const { user } = useAuth();
  const { notify, supported, permission } = useDeviceNotifications();
  // Track first-load completion so we don't fire 50 toasts on refresh
  const skipRef = useRef<{ orgMsg: boolean; talent: boolean }>({
    orgMsg: false,
    talent: false,
  });

  useEffect(() => {
    skipRef.current = { orgMsg: false, talent: false };
    // Mark "skip" off after subscription confirmation so any genuinely new
    // INSERTs after this point fire notifications.
    const t = window.setTimeout(() => {
      skipRef.current = { orgMsg: true, talent: true };
    }, 1500);
    return () => window.clearTimeout(t);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supported || permission !== "granted") return;

    const orgChannel = supabase
      .channel(`device-notif-orgmsg-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          if (!skipRef.current.orgMsg) return;
          const row = payload.new as { body?: string; sender_id?: string };
          notify("org_dm", {
            title: "New message",
            body: row.body?.slice(0, 140) ?? "You received a new direct message.",
            tag: `org-msg-${row.sender_id ?? "x"}`,
            onClickPath: "/messages",
          });
        }
      )
      .subscribe();

    const talentChannel = supabase
      .channel(`device-notif-talent-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "talent_contact_requests",
          filter: `candidate_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!skipRef.current.talent) return;
          const row = payload.new as { initial_message?: string | null };
          notify("recruiter", {
            title: "New recruiter outreach",
            body:
              row.initial_message?.slice(0, 140) ??
              "An employer wants to connect with you.",
            tag: "talent-inbox",
            onClickPath: "/operator/inbox",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orgChannel);
      supabase.removeChannel(talentChannel);
    };
  }, [user?.id, supported, permission, notify]);

  return null;
}
