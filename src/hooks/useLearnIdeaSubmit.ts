import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";

export interface LearnIdeaPayload {
  termId: string;
  termName: string;
  role?: string;
  title: string;
  problem: string;
  solution?: string;
  honeypot?: string;
  sourcePath?: string;
}

export function useLearnIdeaSubmit() {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (payload: LearnIdeaPayload) => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Create or sign in to a JobLine account before sending ideas to staff review.",
          variant: "destructive",
        });
        return false;
      }

      if (!payload.title.trim() || !payload.problem.trim()) {
        toast({
          title: "Missing required fields",
          description: "Add a title and describe the problem before submitting.",
          variant: "destructive",
        });
        return false;
      }

      setIsSubmitting(true);

      try {
        const { error } = await (supabase as any).rpc("submit_learning_idea", {
          _term_id: payload.termId,
          _term_name: payload.termName,
          _role: payload.role?.trim() || null,
          _title: payload.title.trim(),
          _problem: payload.problem.trim(),
          _solution: payload.solution?.trim() || null,
          _source_path: payload.sourcePath ?? window.location.pathname,
          _honeypot: payload.honeypot ?? null,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Idea submitted",
          description: organization?.id
            ? "Your idea was sent to JobLine staff for admin review."
            : "Your idea was sent to JobLine staff for platform review.",
        });

        return true;
      } catch (error) {
        toast({
          title: "Submission failed",
          description: getSafeErrorMessage(error),
          variant: "destructive",
        });

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [organization?.id, toast, user],
  );

  return { submit, isSubmitting };
}