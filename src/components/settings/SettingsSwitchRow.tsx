import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SettingsSwitchRowProps {
  /** Main label text */
  label: string;
  /** Optional description below the label */
  description?: string;
  /** Current switch state */
  checked: boolean;
  /** Called when the switch is toggled */
  onCheckedChange: (checked: boolean) => void;
  /** Whether to render inside a bordered container (default: false) */
  bordered?: boolean;
  /** Disable the switch + dim the row */
  disabled?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * Consistent toggle row used across settings forms.
 * Replaces duplicated label + description + switch patterns.
 */
export function SettingsSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  bordered = false,
  disabled = false,
  className,
}: SettingsSwitchRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        bordered && "rounded-lg border p-3",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="min-w-0">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
