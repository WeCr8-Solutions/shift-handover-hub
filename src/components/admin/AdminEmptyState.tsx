import { ReactNode } from "react";
import { Inbox, ShieldQuestion } from "lucide-react";

interface AdminEmptyStateProps {
  /** Friendly heading line */
  title?: string;
  /** Optional subtext */
  description?: string;
  /** When true, surfaces the "could be RLS scope" hint to platform admins */
  showPermissionHint?: boolean;
  /** Optional CTA */
  action?: ReactNode;
}

/**
 * Shared empty state for admin panels. When `showPermissionHint` is true
 * and the admin sees zero rows, suggests checking org scope or permissions
 * before assuming the data is genuinely empty.
 */
export function AdminEmptyState({
  title = "No records to show",
  description,
  showPermissionHint = false,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2 text-muted-foreground">
      <Inbox className="w-8 h-8 opacity-60" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs">{description}</p>}
      {showPermissionHint && (
        <div className="mt-2 inline-flex items-start gap-2 max-w-md text-[11px] rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2 text-left">
          <ShieldQuestion className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Empty due to permission scope? Try selecting a specific organization in the
            scope selector, or use <strong>Open as Customer</strong> from Org Detail to
            view this data with the customer's RLS context.
          </span>
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
