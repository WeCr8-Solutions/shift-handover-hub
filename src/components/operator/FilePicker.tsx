import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  accept?: string;
  /** Called once the user picks a file. Receive the File and reset the input. */
  onFile: (file: File) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  /** Label for the trigger button (e.g. "Choose file", "Upload resume"). */
  label?: string;
  /** Optional secondary action shown next to the picker (e.g. Remove). */
  rightSlot?: React.ReactNode;
  /** Currently selected/saved filename to display. */
  currentFileName?: string | null;
  /** Optional max bytes; rejected files trigger onTooLarge. */
  maxBytes?: number;
  onTooLarge?: (bytes: number, max: number) => void;
  className?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  size?: "sm" | "default";
}

/**
 * A polished file picker that replaces the native <input type="file"> button.
 * - Handles long filenames (truncates, full name in title).
 * - Prevents horizontal overflow on narrow viewports.
 * - Shows a spinner while loading.
 */
export function FilePicker({
  accept,
  onFile,
  disabled,
  loading,
  label = "Choose file",
  rightSlot,
  currentFileName,
  maxBytes,
  onTooLarge,
  className,
  buttonVariant = "outline",
  size = "default",
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const displayName = pickedName ?? currentFileName ?? null;

  return (
    <div className={cn("min-w-0 w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || loading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (maxBytes && file.size > maxBytes) {
            onTooLarge?.(file.size, maxBytes);
            e.target.value = "";
            return;
          }
          setPickedName(file.name);
          try {
            await onFile(file);
          } finally {
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Button
          type="button"
          variant={buttonVariant}
          size={size}
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
          className="gap-2 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? "Uploading…" : label}
        </Button>

        {displayName && (
          <div className="flex items-center gap-1.5 min-w-0 max-w-full text-sm text-muted-foreground rounded-md border bg-muted/30 px-2 py-1">
            <span
              className="truncate min-w-0 max-w-[14rem] sm:max-w-xs"
              title={displayName}
            >
              {displayName}
            </span>
            {!loading && pickedName && (
              <button
                type="button"
                onClick={() => setPickedName(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear selected file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
      </div>
    </div>
  );
}
