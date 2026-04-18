import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PublicRecommendation {
  id: string;
  author_id: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_public_username: string | null;
  relationship: string | null;
  body: string;
  created_at: string;
}

export interface SocialCounts {
  follower_count: number;
  following_count: number;
  recommendation_count: number;
}

export type ConnectionStatus = "none" | "pending_outgoing" | "pending_incoming" | "accepted";

/** Public, anon-friendly: load recommendations + counts for a username. */
export function usePublicOperatorSocial(username: string | undefined) {
  const [recommendations, setRecommendations] = useState<PublicRecommendation[]>([]);
  const [counts, setCounts] = useState<SocialCounts>({ follower_count: 0, following_count: 0, recommendation_count: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    const [recs, cnt] = await Promise.all([
      (supabase as any).rpc("list_public_operator_recommendations", { _username: username }),
      (supabase as any).rpc("get_public_operator_social_counts", { _username: username }),
    ]);
    setRecommendations((recs.data as PublicRecommendation[] | null) ?? []);
    const c = (cnt.data as SocialCounts[] | null)?.[0];
    setCounts({
      follower_count: Number(c?.follower_count ?? 0),
      following_count: Number(c?.following_count ?? 0),
      recommendation_count: Number(c?.recommendation_count ?? 0),
    });
    setLoading(false);
  }, [username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { recommendations, counts, loading, refresh };
}

/** Authenticated viewer's relationship to a target user (connection + follow + own rec). */
export function useViewerRelationship(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("none");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const [myRecommendation, setMyRecommendation] = useState<{ id: string; body: string; relationship: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [conn, foll, rec] = await Promise.all([
      supabase
        .from("operator_connections")
        .select("id, status, requester_id, addressee_id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
        .maybeSingle(),
      supabase
        .from("operator_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("followed_id", targetUserId)
        .maybeSingle(),
      supabase
        .from("operator_recommendations")
        .select("id, body, relationship")
        .eq("author_id", user.id)
        .eq("recipient_id", targetUserId)
        .maybeSingle(),
    ]);

    if (conn.data) {
      setConnectionId(conn.data.id);
      if (conn.data.status === "accepted") setConnectionStatus("accepted");
      else if (conn.data.status === "pending" && conn.data.requester_id === user.id) setConnectionStatus("pending_outgoing");
      else if (conn.data.status === "pending") setConnectionStatus("pending_incoming");
      else setConnectionStatus("none");
    } else {
      setConnectionStatus("none");
      setConnectionId(null);
    }

    setIsFollowing(!!foll.data);
    setFollowId((foll.data as { id: string } | null)?.id ?? null);
    setMyRecommendation((rec.data as { id: string; body: string; relationship: string | null } | null) ?? null);
    setLoading(false);
  }, [user?.id, targetUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestConnection = useCallback(async () => {
    if (!user?.id || !targetUserId) throw new Error("Sign in required");
    const { error } = await supabase.from("operator_connections").insert({
      requester_id: user.id,
      addressee_id: targetUserId,
    });
    if (error) throw error;
    await refresh();
  }, [user?.id, targetUserId, refresh]);

  const acceptConnection = useCallback(async () => {
    if (!connectionId) return;
    const { error } = await supabase
      .from("operator_connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);
    if (error) throw error;
    await refresh();
  }, [connectionId, refresh]);

  const removeConnection = useCallback(async () => {
    if (!connectionId) return;
    const { error } = await supabase.from("operator_connections").delete().eq("id", connectionId);
    if (error) throw error;
    await refresh();
  }, [connectionId, refresh]);

  const toggleFollow = useCallback(async () => {
    if (!user?.id || !targetUserId) throw new Error("Sign in required");
    if (isFollowing && followId) {
      const { error } = await supabase.from("operator_follows").delete().eq("id", followId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("operator_follows")
        .insert({ follower_id: user.id, followed_id: targetUserId });
      if (error) throw error;
    }
    await refresh();
  }, [user?.id, targetUserId, isFollowing, followId, refresh]);

  const writeRecommendation = useCallback(
    async (body: string, relationship: string | null) => {
      if (!user?.id || !targetUserId) throw new Error("Sign in required");
      if (myRecommendation) {
        const { error } = await supabase
          .from("operator_recommendations")
          .update({ body, relationship })
          .eq("id", myRecommendation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("operator_recommendations")
          .insert({ author_id: user.id, recipient_id: targetUserId, body, relationship });
        if (error) throw error;
      }
      await refresh();
    },
    [user?.id, targetUserId, myRecommendation, refresh],
  );

  const deleteMyRecommendation = useCallback(async () => {
    if (!myRecommendation) return;
    const { error } = await supabase.from("operator_recommendations").delete().eq("id", myRecommendation.id);
    if (error) throw error;
    await refresh();
  }, [myRecommendation, refresh]);

  return {
    isViewerSelf: user?.id === targetUserId,
    isAuthenticated: !!user?.id,
    connectionStatus,
    isFollowing,
    myRecommendation,
    loading,
    requestConnection,
    acceptConnection,
    removeConnection,
    toggleFollow,
    writeRecommendation,
    deleteMyRecommendation,
    refresh,
  };
}
