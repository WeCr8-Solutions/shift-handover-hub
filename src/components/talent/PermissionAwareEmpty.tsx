import { ShieldAlert, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Mode = "empty" | "permission" | "tier";

interface Props {
  mode: Mode;
  title?: string;
  description?: string;
  action?: { label: string; href: string };
}

/**
 * Talent surfaces — distinguishes between truly empty results, permission
 * denials (RLS / not a verified employer), and tier-gated features. This
 * prevents the "blank screen looks like a bug" UX called out in the audit.
 */
export function PermissionAwareEmpty({ mode, title, description, action }: Props) {
  const Icon = mode === "empty" ? Inbox : ShieldAlert;
  const fallbackTitle =
    mode === "permission"
      ? "You don't have access to view this"
      : mode === "tier"
        ? "Upgrade required"
        : "Nothing here yet";
  const fallbackDescription =
    mode === "permission"
      ? "This data is restricted by your role or organization. Contact your admin if you believe this is an error."
      : mode === "tier"
        ? "This feature is included in Team and Enterprise plans."
        : "Once data is available, it will appear here.";

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed rounded-lg bg-muted/20">
      <Icon className="h-10 w-10 text-muted-foreground mb-3" aria-hidden />
      <h3 className="text-base font-semibold">{title ?? fallbackTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {description ?? fallbackDescription}
      </p>
      {action && (
        <Button asChild size="sm" className="mt-4">
          <Link to={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
