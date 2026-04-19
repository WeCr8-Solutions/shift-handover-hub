import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bug, X } from "lucide-react";
import { IssueReportDialog } from "@/components/IssueReportDialog";

interface SettingsErrorBannerProps {
  /** The last save/load error message. Null/empty hides the banner. */
  error: string | null;
  /** Called when the user dismisses the banner */
  onDismiss?: () => void;
  /** Settings panel name, used to prefill the bug report title */
  context: string;
}

/**
 * Persistent error banner shown when a settings save/load fails.
 * Provides a one-click "Report to development" action that opens the
 * IssueReportDialog prefilled with the error context.
 */
export function SettingsErrorBanner({ error, onDismiss, context }: SettingsErrorBannerProps) {
  const [reportOpen, setReportOpen] = useState(false);

  if (!error) return null;

  // Synthesize an Error so the dialog severity defaults to "high"
  const prefillError = new Error(`[${context}] ${error}`);

  return (
    <>
      <Alert variant="destructive" className="relative">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="pr-8">Could not save your changes</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">{error}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReportOpen(true)}
              className="gap-1.5"
            >
              <Bug className="h-3.5 w-3.5" />
              Report to development
            </Button>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted/50"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </Alert>

      <IssueReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        prefillError={prefillError}
      />
    </>
  );
}
