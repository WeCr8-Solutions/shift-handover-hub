import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface SafeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The exact string the user must type to confirm deletion */
  confirmValue: string;
  /** Dialog title — defaults to "Confirm Deletion" */
  title?: string;
  /** Description shown above the input. Supports ReactNode for inline formatting. */
  description?: React.ReactNode;
  /** Label for the delete button — defaults to "Delete" */
  deleteLabel?: string;
  /** Async or sync callback fired when the user confirms */
  onConfirm: () => void | Promise<void>;
}

export function SafeDeleteDialog({
  open,
  onOpenChange,
  confirmValue,
  title = "Confirm Deletion",
  description,
  deleteLabel = "Delete",
  onConfirm,
}: SafeDeleteDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = inputValue === confirmValue;

  const handleConfirm = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setInputValue("");
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setInputValue("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {description || (
                <>
                  This action is permanent and cannot be undone. Type{" "}
                  <span className="font-mono font-bold text-foreground">{confirmValue}</span>{" "}
                  to confirm.
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="safe-delete-confirm">
            Type <span className="font-mono font-semibold text-foreground">{confirmValue}</span> to confirm
          </Label>
          <Input
            id="safe-delete-confirm"
            placeholder={confirmValue}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isMatch || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              deleteLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
