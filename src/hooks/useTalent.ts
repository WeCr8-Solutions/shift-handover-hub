import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

export interface TalentSearchFilters {
  search?: string;
  skill?: string;
  machineCategory?: string;
  minYears?: number;
  location?: string;
  openToWorkOnly?: boolean;
}

export interface TalentCandidate {
  user_id: string;
  display_name: string | null;
  headline: string | null;
  location_city: string | null;
  location_region: string | null;
  years_experience: number | null;
  open_to_work: boolean;
  willing_to_relocate: boolean;
  linkedin_url: string | null;
  avatar_url: string | null;
  cert_count: number;
  verified_cert_count: number;
}

export interface SavedList {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface SavedCandidate {
  id: string;
  list_id: string;
  organization_id: string;
  candidate_user_id: string;
  stage: string;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  organization_id: string;
  organization_name: string | null;
  candidate_user_id: string;
  sender_user_id: string;
  sender_display_name: string | null;
  subject: string;
  message: string;
  candidate_response: string;
  candidate_response_message: string | null;
  responded_at: string | null;
  created_at: string;
}

export function useTalentSearch(filters: TalentSearchFilters) {
  const [results, setResults] = useState<TalentCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("operator_profiles")
        .select(`
          user_id, headline, location_city, location_region,
          years_experience, open_to_work, willing_to_relocate,
          linkedin_url, avatar_url
        `)
        .eq("is_discoverable", true);

      if (filters.openToWorkOnly) q = q.eq("open_to_work", true);
      if (filters.minYears) q = q.gte("years_experience", filters.minYears);
      if (filters.location) {
        q = q.or(`location_city.ilike.%${filters.location}%,location_region.ilike.%${filters.location}%`);
      }
      if (filters.search) {
        q = q.or(`headline.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
      }

      const { data: profiles, error: pErr } = await q.limit(100);
      if (pErr) throw pErr;
      const userIds = (profiles ?? []).map((p) => p.user_id);
      if (!userIds.length) {
        setResults([]);
        return;
      }

      // Fetch display names
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const nameMap = new Map((profileRows ?? []).map((p) => [p.user_id, p.display_name]));

      // Filter by skill
      let allowedIds = new Set(userIds);
      if (filters.skill) {
        const { data: sk } = await supabase
          .from("operator_skills")
          .select("user_id")
          .in("user_id", userIds)
          .ilike("skill", `%${filters.skill}%`);
        allowedIds = new Set((sk ?? []).map((s) => s.user_id));
      }
      if (filters.machineCategory) {
        const { data: mc } = await supabase
          .from("operator_machine_proficiencies")
          .select("user_id")
          .in("user_id", userIds)
          .ilike("machine_category", `%${filters.machineCategory}%`);
        const machineIds = new Set((mc ?? []).map((m) => m.user_id));
        allowedIds = new Set(Array.from(allowedIds).filter((id) => machineIds.has(id)));
      }

      // Cert counts
      const { data: certs } = await supabase
        .from("operator_certifications")
        .select("user_id, verification_source")
        .in("user_id", Array.from(allowedIds));
      const certCounts = new Map<string, { total: number; verified: number }>();
      (certs ?? []).forEach((c) => {
        const cur = certCounts.get(c.user_id) ?? { total: 0, verified: 0 };
        cur.total += 1;
        if (c.verification_source.startsWith("verified_")) cur.verified += 1;
        certCounts.set(c.user_id, cur);
      });

      const out: TalentCandidate[] = (profiles ?? [])
        .filter((p) => allowedIds.has(p.user_id))
        .map((p) => ({
          user_id: p.user_id,
          display_name: nameMap.get(p.user_id) ?? null,
          headline: p.headline,
          location_city: p.location_city,
          location_region: p.location_region,
          years_experience: p.years_experience,
          open_to_work: p.open_to_work,
          willing_to_relocate: p.willing_to_relocate,
          linkedin_url: p.linkedin_url,
          avatar_url: p.avatar_url,
          cert_count: certCounts.get(p.user_id)?.total ?? 0,
          verified_cert_count: certCounts.get(p.user_id)?.verified ?? 0,
        }));
      setResults(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    search();
  }, [search]);

  return { results, loading, error, refresh: search };
}

export function useSavedLists() {
  const { organization } = useOrgContext();
  const { user } = useAuth();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [l, c] = await Promise.all([
      supabase.from("talent_saved_lists").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }),
      supabase.from("talent_saved_candidates").select("*").eq("organization_id", organization.id),
    ]);
    setLists((l.data as SavedList[] | null) ?? []);
    setCandidates((c.data as SavedCandidate[] | null) ?? []);
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createList = useCallback(async (name: string, description?: string) => {
    if (!organization?.id || !user?.id) throw new Error("No organization");
    const { error } = await supabase.from("talent_saved_lists").insert({
      organization_id: organization.id,
      name,
      description: description ?? null,
      created_by: user.id,
    });
    if (error) throw error;
    await refresh();
  }, [organization?.id, user?.id, refresh]);

  const addCandidate = useCallback(async (listId: string, candidateUserId: string) => {
    if (!organization?.id || !user?.id) throw new Error("No organization");
    const { error } = await supabase.from("talent_saved_candidates").insert({
      list_id: listId,
      organization_id: organization.id,
      candidate_user_id: candidateUserId,
      added_by: user.id,
      stage: "new",
    });
    if (error && !error.message.includes("duplicate")) throw error;
    await refresh();
  }, [organization?.id, user?.id, refresh]);

  const updateCandidateStage = useCallback(async (id: string, stage: string, notes?: string) => {
    const patch: Record<string, unknown> = { stage };
    if (notes !== undefined) patch.notes = notes;
    const { error } = await supabase.from("talent_saved_candidates").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const removeCandidate = useCallback(async (id: string) => {
    const { error } = await supabase.from("talent_saved_candidates").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return { lists, candidates, loading, refresh, createList, addCandidate, updateCandidateStage, removeCandidate };
}

export function useContactRequests() {
  const { organization } = useOrgContext();
  const { user, profile } = useAuth();
  const [outbound, setOutbound] = useState<ContactRequest[]>([]);
  const [inbound, setInbound] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const inRes = await supabase
      .from("talent_contact_requests")
      .select("*")
      .eq("candidate_user_id", user.id)
      .order("created_at", { ascending: false });
    setInbound((inRes.data as ContactRequest[] | null) ?? []);

    if (organization?.id) {
      const outRes = await supabase
        .from("talent_contact_requests")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });
      setOutbound((outRes.data as ContactRequest[] | null) ?? []);
    } else {
      setOutbound([]);
    }
    setLoading(false);
  }, [user?.id, organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendRequest = useCallback(async (candidateUserId: string, subject: string, message: string) => {
    if (!organization?.id || !user?.id) throw new Error("No organization");
    const { error } = await supabase.from("talent_contact_requests").insert({
      organization_id: organization.id,
      organization_name: organization.name,
      candidate_user_id: candidateUserId,
      sender_user_id: user.id,
      sender_display_name: profile?.display_name ?? null,
      subject,
      message,
    });
    if (error) throw error;
    await refresh();
  }, [organization?.id, organization?.name, user?.id, profile?.display_name, refresh]);

  const respond = useCallback(async (requestId: string, response: "accepted" | "declined", message?: string) => {
    const { error } = await supabase
      .from("talent_contact_requests")
      .update({
        candidate_response: response,
        candidate_response_message: message ?? null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return { inbound, outbound, loading, refresh, sendRequest, respond };
}
