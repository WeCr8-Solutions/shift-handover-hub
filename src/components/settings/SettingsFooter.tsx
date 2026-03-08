import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RotateCcw } from "lucide-react";

interface SettingsFooterProps {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Called when the user clicks Save */
  onSave: () => void;
  /** Called when the user clicks Discard (optional) */
  onDiscard?: () => void;
  /** Label for the save button (default: "Save Settings") */
  label?: string;
}

/**
 * Shared footer for settings forms with Save/Discard buttons and an "Unsaved changes" badge.
 * Eliminates ~20 lines of duplicated JSX per settings component.
 */
export function SettingsFooter({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  label = "Save Settings",
}: SettingsFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      {isDirty && (
        <>
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            Unsaved changes
          </Badge>
          {onDiscard && (
            <Button variant="ghost" size="sm" onClick={onDiscard} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </Button>
          )}
        </>
      )}
      <Button onClick={onSave} disabled={isSaving || !isDirty} className="gap-2">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {isDirty ? label : "Saved"}
          </>
        )}
      </Button>
    </div>
  );
}
