import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

interface ReadOnlyGateProps {
  /** Whether the current user can edit these settings */
  canEdit: boolean;
  /** Content to render (will be wrapped in disabled fieldset when read-only) */
  children: ReactNode;
  /** Custom notice message (optional) */
  message?: string;
}

/**
 * Wraps settings content in a disabled `<fieldset>` when the user lacks edit permissions.
 *
 * Uses native `<fieldset disabled>` instead of `pointer-events-none` to properly
 * disable all form elements for keyboard and screen-reader users (fixes audit R1).
 */
export function ReadOnlyGate({
  canEdit,
  children,
  message = "These settings are managed by your organization admin. Contact them to request changes.",
}: ReadOnlyGateProps) {
  if (canEdit) return <>{children}</>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">{message}</p>
      </div>
      <fieldset disabled className="opacity-75">
        {children}
      </fieldset>
    </div>
  );
}
