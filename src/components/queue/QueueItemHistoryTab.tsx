import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueItemHistory } from "@/hooks/useQueue";
import { formatDistanceToNow } from "date-fns";

interface QueueItemHistoryTabProps {
  history: QueueItemHistory[];
}

export function QueueItemHistoryTab({ history }: QueueItemHistoryTabProps) {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1">
              <p>
                <span className="font-medium">{entry.user_name}</span>{" "}
                {entry.action}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No history yet</p>
        )}
      </div>
    </ScrollArea>
  );
}
