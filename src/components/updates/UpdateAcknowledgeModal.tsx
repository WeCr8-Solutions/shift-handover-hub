import { GlobalUpdate } from "@/hooks/useGlobalUpdates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UpdateAcknowledgeModalProps {
  updates: GlobalUpdate[];
  onAcknowledge: (id: string) => Promise<boolean>;
}

export function UpdateAcknowledgeModal({ updates, onAcknowledge }: UpdateAcknowledgeModalProps) {
  if (updates.length === 0) return null;
  const current = updates[0];

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            System Update Requires Acknowledgement
          </DialogTitle>
          <DialogDescription>
            Please review and acknowledge to continue.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              {current.version_number && (
                <Badge variant="outline" className="font-mono text-xs">{current.version_number}</Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">{current.category.replace("_", " ")}</Badge>
            </div>
            <h3 className="font-semibold">{current.title}</h3>
            {current.summary && <p className="text-sm text-muted-foreground">{current.summary}</p>}
            {current.how_it_helps_users && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1">How This Helps You</p>
                <p className="text-sm">{current.how_it_helps_users}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <Button className="w-full gap-2" onClick={() => onAcknowledge(current.id)}>
          <Check className="w-4 h-4" /> I Understand
        </Button>
      </DialogContent>
    </Dialog>
  );
}
