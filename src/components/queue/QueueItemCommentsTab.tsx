import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueItemComment } from "@/hooks/useQueue";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { User, Send, Loader2 } from "lucide-react";

interface QueueItemCommentsTabProps {
  comments: QueueItemComment[];
  onAddComment: (itemId: string, content: string) => Promise<{ error: string | null }>;
  itemId: string;
  onReloadComments: () => void;
}

export function QueueItemCommentsTab({ comments, onAddComment, itemId, onReloadComments }: QueueItemCommentsTabProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    const { error } = await onAddComment(itemId, newComment.trim());
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setNewComment("");
      onReloadComments();
    }
  };

  return (
    <>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{comment.user_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No comments yet</p>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </>
  );
}
