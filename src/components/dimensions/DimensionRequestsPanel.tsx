import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DimensionCheckRequest } from "@/hooks/useDimensionRequests";
import { MessageSquare, Check, X, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DimensionRequestsPanelProps {
  requests: DimensionCheckRequest[];
  isSupervisor: boolean;
  onReview: (requestId: string, status: "approved" | "dismissed", notes?: string) => Promise<{ error: string | null }>;
  onAddDimension?: (stepId: string) => void;
}

export function DimensionRequestsPanel({
  requests,
  isSupervisor,
  onReview,
  onAddDimension,
}: DimensionRequestsPanelProps) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  if (requests.length === 0) return null;

  const handleReview = async (id: string, status: "approved" | "dismissed") => {
    setSubmitting(true);
    const { error } = await onReview(id, status, reviewNotes || undefined);
    setSubmitting(false);
    if (!error) {
      const req = requests.find((r) => r.id === id);
      if (status === "approved" && onAddDimension && req) {
        onAddDimension(req.routing_step_id);
      }
      setReviewingId(null);
      setReviewNotes("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquare className="w-3.5 h-3.5" />
        Dimension Check Requests
        {pending.length > 0 && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            {pending.length}
          </Badge>
        )}
      </div>

      {pending.map((req) => (
        <div key={req.id} className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-2.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{req.requested_by_name || "Operator"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                {format(new Date(req.created_at), "MMM d, h:mm a")}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/50 shrink-0">
              Pending
            </Badge>
          </div>

          {isSupervisor && (
            <>
              {reviewingId === req.id ? (
                <div className="space-y-2 pt-1 border-t border-amber-500/20">
                  <Textarea
                    placeholder="Notes (optional)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="text-xs min-h-[40px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1 text-xs h-7 flex-1"
                      disabled={submitting}
                      onClick={() => handleReview(req.id, "approved")}
                    >
                      {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve & Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7 flex-1"
                      disabled={submitting}
                      onClick={() => handleReview(req.id, "dismissed")}
                    >
                      <X className="w-3 h-3" /> Dismiss
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 w-full"
                  onClick={() => setReviewingId(req.id)}
                >
                  Review
                </Button>
              )}
            </>
          )}
        </div>
      ))}

      {reviewed.length > 0 && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
            {reviewed.length} reviewed request{reviewed.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-1 space-y-1">
            {reviewed.map((req) => (
              <div
                key={req.id}
                className={cn(
                  "border rounded p-2",
                  req.status === "approved" ? "border-green-500/20 bg-green-500/5" : "border-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{req.requested_by_name}: {req.reason}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      req.status === "approved" ? "text-green-600 border-green-500/50" : "text-muted-foreground"
                    )}
                  >
                    {req.status === "approved" ? "Approved" : "Dismissed"}
                  </Badge>
                </div>
                {req.review_notes && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{req.reviewed_by_name}: {req.review_notes}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
