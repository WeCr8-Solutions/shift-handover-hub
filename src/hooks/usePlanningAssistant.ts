import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function usePlanningAssistant(organizationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (input: string) => {
      if (!organizationId || !input.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantSoFar = "";
      const allMessages = [...messages, userMsg];

      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-planning-assistant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: allMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              organization_id: organizationId,
            }),
          }
        );

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));

          // Handle limit_reached specifically
          if (resp.status === 429 && errData.error === "limit_reached") {
            toast.error("Daily AI message limit reached. Upgrade your plan for more messages.");
            // Remove the optimistic user message
            setMessages((prev) => prev.slice(0, -1));
            // Refresh usage data
            queryClient.invalidateQueries({ queryKey: ["ai-chat-usage"] });
            setIsLoading(false);
            return;
          }

          const errMsg = errData.error || `Request failed (${resp.status})`;
          toast.error(errMsg);
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        const upsertAssistant = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, content: assistantSoFar }
                  : m
              );
            }
            return [
              ...prev,
              {
                role: "assistant" as const,
                content: assistantSoFar,
                timestamp: new Date().toISOString(),
              },
            ];
          });
        };

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Flush remaining buffer
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (content) upsertAssistant(content);
            } catch {
              /* ignore */
            }
          }
        }

        // Refresh usage count after successful message
        queryClient.invalidateQueries({ queryKey: ["ai-chat-usage"] });

        // Save session
        const finalMessages = [
          ...allMessages,
          {
            role: "assistant" as const,
            content: assistantSoFar,
            timestamp: new Date().toISOString(),
          },
        ];

        if (sessionId) {
          await supabase
            .from("planning_chat_sessions" as any)
            .update({
              messages: finalMessages as any,
            })
            .eq("id", sessionId);
        } else if (assistantSoFar) {
          const title =
            input.length > 60 ? input.slice(0, 57) + "..." : input;
          const { data } = await supabase
            .from("planning_chat_sessions" as any)
            .insert({
              organization_id: organizationId,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              title,
              messages: finalMessages as any,
            } as any)
            .select("id")
            .single();
          if (data) setSessionId((data as any).id);
        }
      } catch (e) {
        console.error("Planning assistant error:", e);
        toast.error("Failed to get AI response. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, organizationId, sessionId, queryClient]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
