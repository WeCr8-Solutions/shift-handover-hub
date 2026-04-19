import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessagesSquare } from "lucide-react";
import { useMessageThread } from "@/hooks/useMessageThread";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MessageThreadProps {
  requestId: string;
  /** Role of the *current viewer* relative to the request. */
  viewerRole: "employer" | "candidate";
}

export function MessageThread({ requestId, viewerRole }: MessageThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { replies, loading, sending, sendReply } = useMessageThread(requestId, viewerRole);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    try {
      await sendReply(draft);
      setDraft("");
    } catch (err) {
      toast({
        title: "Failed to send",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessagesSquare className="w-4 h-4" />
        Conversation
      </div>

      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : replies.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No replies yet — start the conversation.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {replies.map((r) => {
            const mine = r.sender_user_id === user?.id;
            return (
              <div key={r.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={mine ? "secondary" : "outline"} className="text-[10px] h-4 px-1">
                      {r.sender_role}
                    </Badge>
                    <span className="text-[10px] opacity-70">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{r.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Type a reply…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          maxLength={2000}
          className="resize-none"
        />
        <Button onClick={handleSend} disabled={!draft.trim() || sending} size="sm" className="gap-1 self-end">
          <Send className="w-3 h-3" /> Send
        </Button>
      </div>
    </div>
  );
}
