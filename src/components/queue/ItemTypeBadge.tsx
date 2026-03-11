import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plug } from "lucide-react";

interface ItemTypeBadgeProps {
  type: "quote" | "work_order" | "erp";
  /** outline = light bg + border (kanban/list), solid = filled bg (dialog header) */
  variant?: "outline" | "solid";
  size?: "sm" | "md";
  className?: string;
}

const OUTLINE_STYLES: Record<ItemTypeBadgeProps["type"], string> = {
  quote:      "border-warning/50 text-warning bg-warning/10",
  work_order: "border-primary/50 text-primary bg-primary/10",
  erp:        "border-role-org-owner/50 text-role-org-owner bg-role-org-owner/10",
};

const SOLID_STYLES: Record<ItemTypeBadgeProps["type"], string> = {
  quote:      "bg-warning text-primary-foreground",
  work_order: "bg-primary text-primary-foreground",
  erp:        "bg-role-org-owner text-primary-foreground",
};

const LABELS: Record<ItemTypeBadgeProps["type"], string> = {
  quote:      "Quote",
  work_order: "Work Order",
  erp:        "ERP",
};

export function ItemTypeBadge({ type, variant = "outline", size = "sm", className }: ItemTypeBadgeProps) {
  const styles = variant === "solid" ? SOLID_STYLES[type] : OUTLINE_STYLES[type];
  const sizeClass = size === "md" ? "text-sm" : "text-xs";
  const solidMod = variant === "solid" ? "font-semibold px-3 uppercase" : "";

  return (
    <Badge
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(sizeClass, solidMod, styles, className)}
    >
      {type === "erp" && <Plug className="w-2.5 h-2.5 mr-0.5" />}
      {LABELS[type]}
    </Badge>
  );
}
