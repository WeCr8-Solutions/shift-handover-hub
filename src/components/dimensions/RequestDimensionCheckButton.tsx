import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquarePlus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface RequestDimensionCheckButtonProps {
  routingStepId: string;
  queueItemId: string;
  operationName: string;
  onSubmit: (routingStepId: string, queueItemId: string, reason: string) => Promise<{ error: string | null }>;
}

export function RequestDimensionCheckButton({
  routingStepId,
  queueItemId,
  operationName,
  onSubmit,
}: RequestDimensionCheckButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    const { error } = await onSubmit(routingStepId, queueItemId, reason.trim());
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request", { description: error });
    } else {
      toast.success("Request sent", {
        description: `Dimension check request sent to supervisor for "${operationName}".`,
      });
      setReason("");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
          <MessageSquarePlus className="w-3 h-3" />
          Request Dim Check
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="start">
        <div>
          <Label className="text-xs font-medium">Request Dimension Check</Label>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Ask supervisor to add dimensional inspection to <strong>{operationName}</strong>.
          </p>
        </div>
        <Textarea
          placeholder="Reason — e.g. tight tolerance on bore, customer spec, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="text-xs min-h-[60px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs h-7">
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1 text-xs h-7"
            disabled={!reason.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Send
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
