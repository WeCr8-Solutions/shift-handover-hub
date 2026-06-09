import { Badge } from "@/components/ui/badge";
import type { PackageStatus } from "@/hooks/usePackages";

const LABELS: Record<PackageStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  closed: "Closed",
  cancelled: "Cancelled",
};

const VARIANTS: Record<PackageStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  in_progress: "default",
  ready_to_ship: "secondary",
  shipped: "secondary",
  closed: "outline",
  cancelled: "destructive",
};

export function PackageStatusBadge({ status }: { status: PackageStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
