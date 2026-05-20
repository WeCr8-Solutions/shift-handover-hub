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
}

interface LearningIdeasInsert {
  term_id: string;
  term_name: string;
  role: string | null;
  title: string;
  problem: string;
  solution: string | null;
  user_id: string | null;
  org_id: string | null;
}

export function useLearnIdeaSubmit() {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (payload: LearnIdeaPayload) => {
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
        const row: LearningIdeasInsert = {
          term_id: payload.termId,
          term_name: payload.termName,
          role: payload.role?.trim() || null,
          title: payload.title.trim(),
          problem: payload.problem.trim(),
          solution: payload.solution?.trim() || null,
          user_id: user?.id ?? null,
          org_id: organization?.id ?? null,
        };

        const { error } = await supabase
          .from("learning_ideas")
          .insert(row as unknown as Record<string, unknown>);

        if (error) {
          throw error;
        }

        toast({
          title: "Idea captured",
          description: "Your workflow idea has been saved for follow-up.",
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
    [organization?.id, toast, user?.id],
  );

  return { submit, isSubmitting };
}