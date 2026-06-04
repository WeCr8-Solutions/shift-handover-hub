/**
 * PrintCoCButton — opens the Certificate of Conformance print route in a new
 * tab. Should only be shown when the work order is in a completed state.
 */
import { Button } from "@/components/ui/button";
import { FileBadge } from "lucide-react";

interface Props {
  workOrderId: string;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
}

export function PrintCoCButton({ workOrderId, disabled, size = "sm", variant = "outline" }: Props) {
  return (
    <Button
      variant={variant}
      size={size}
      className="gap-2"
      disabled={disabled}
      data-testid="wo-print-coc"
      title="Print AS9100/ISO 9001 Certificate of Conformance"
      onClick={() => window.open(`/work-orders/${workOrderId}/coc`, "_blank", "noopener")}
    >
      <FileBadge className="h-4 w-4" /> Certificate of Conformance
    </Button>
  );
}
