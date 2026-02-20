import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "./useActivityLog";

export type UpdateType = "setup_change" | "adjustment" | "improvement" | "issue" | "other";
export type Priority = "low" | "normal" | "high" | "critical";
export type UpdateStatus = "pending" | "reviewed" | "approved" | "implemented" | "rejected";

export interface JobPerformanceUpdate {
  id: string;
  team_id: string | null;
  station_id: string | null;
  user_id: string;
  user_name: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  update_type: UpdateType;
  priority: Priority;
  affects_cycle_time: boolean;
  affects_quality: boolean;
  affects_safety: boolean;
  requires_tooling_change: boolean;
  requires_program_update: boolean;
  requires_fixture_modification: boolean;
  requires_engineering_review: boolean;
  requires_qa_approval: boolean;
  title: string;
  description: string;
  proposed_solution: string | null;
  expected_benefit: string | null;
  image_urls: string[];
  status: UpdateStatus;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobPerformanceUpdateInput {
  team_id?: string | null;
  station_id?: string | null;
  work_order?: string;
  part_number?: string;
  operation_number?: string;
  update_type: UpdateType;
  priority?: Priority;
  affects_cycle_time?: boolean;
  affects_quality?: boolean;
  affects_safety?: boolean;
  requires_tooling_change?: boolean;
  requires_program_update?: boolean;
  requires_fixture_modification?: boolean;
  requires_engineering_review?: boolean;
  requires_qa_approval?: boolean;
  title: string;
  description: string;
  proposed_solution?: string;
  expected_benefit?: string;
  image_urls?: string[];
}

export function useJobPerformanceUpdates(teamId?: string | null) {
  const { user, profile } = useAuth();
  const { logActivity } = useActivityLog();
  const [updates, setUpdates] = useState<JobPerformanceUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    if (!user) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from("job_performance_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setUpdates(data as JobPerformanceUpdate[]);
    }
    setLoading(false);
  }, [user, teamId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("job-performance-updates-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_performance_updates",
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUpdates]);

  const createUpdate = async (input: CreateJobPerformanceUpdateInput) => {
    if (!user || !profile) {
      return { data: null, error: new Error("User not authenticated") };
    }

    // Get org_id from user's org membership
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("job_performance_updates")
      .insert({
        ...input,
        user_id: user.id,
        user_name: profile.display_name,
        organization_id: orgMember?.organization_id || "",
      })
      .select()
      .single();

    if (!error && data) {
      await logActivity(
        "handoff_created", // Using existing type for now
        `Submitted performance update: ${input.title}`,
        {
          update_id: data.id,
          update_type: input.update_type,
          priority: input.priority,
          station_id: input.station_id,
        }
      );
    }

    return { data: data as JobPerformanceUpdate | null, error };
  };

  const uploadImage = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
    if (!user) {
      return { url: null, error: new Error("User not authenticated") };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("performance-updates")
      .upload(fileName, file);

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Use signed URL for private bucket (expires in 24 hours)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("performance-updates")
      .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours

    if (signedUrlError) {
      return { url: null, error: signedUrlError };
    }

    // Store the file path (not URL) for later signed URL generation
    return { url: fileName, error: null };
  };

  // Helper to get signed URLs for viewing images
  const getSignedImageUrls = async (filePaths: string[]): Promise<string[]> => {
    if (!filePaths.length) return [];
    
    const signedUrls = await Promise.all(
      filePaths.map(async (path) => {
        // If it's already a full URL (legacy), return as-is
        if (path.startsWith('http')) return path;
        
        const { data } = await supabase.storage
          .from("performance-updates")
          .createSignedUrl(path, 60 * 60 * 24); // 24 hours
        return data?.signedUrl || path;
      })
    );
    
    return signedUrls;
  };

  const updateStatus = async (
    updateId: string,
    status: UpdateStatus,
    reviewNotes?: string
  ) => {
    if (!user || !profile) {
      return { error: new Error("User not authenticated") };
    }

    const { error } = await supabase
      .from("job_performance_updates")
      .update({
        status,
        reviewer_id: user.id,
        reviewer_name: profile.display_name,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", updateId);

    if (!error) {
      await fetchUpdates();
    }

    return { error };
  };

  return {
    updates,
    loading,
    createUpdate,
    uploadImage,
    getSignedImageUrls,
    updateStatus,
    refreshUpdates: fetchUpdates,
  };
}
