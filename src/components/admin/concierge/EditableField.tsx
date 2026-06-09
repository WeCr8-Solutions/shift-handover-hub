import { useEffect, useState } from "react";

/**
 * Reusable inline editable field for the Concierge Sales Pack.
 *
 * - On screen: behaves like a contenteditable input/textarea so the JobLine
 *   rep (or a teammate via handoff) can fill in the customer's needs during
 *   a meeting or later.
 * - In print: renders as plain text (any chrome / hover affordances live
 *   inside `.no-print`).
 * - Persists per-engagement under `concierge-field:{engagementId}:{fieldKey}`
 *   in localStorage so an in-progress contract survives reloads and can be
 *   resumed by the same user.
 *
 * Cross-device handoff is handled separately by ConciergeHandoffPanel.
 */
export interface EditableFieldProps {
  fieldKey: string;
  engagementId: string;
  placeholder?: string;
  multiline?: boolean;
  /** Minimum height for multiline; ignored for single-line. */
  minRows?: number;
  className?: string;
  /** Optional value shown when nothing has been typed yet (e.g. a DB default). */
  defaultValue?: string;
  /** Block any further edits (used after contract is sealed). */
  readOnly?: boolean;
}

function storageKey(engagementId: string, fieldKey: string) {
  return `concierge-field:${engagementId}:${fieldKey}`;
}

export function EditableField({
  fieldKey,
  engagementId,
  placeholder,
  multiline,
  minRows = 3,
  className,
  defaultValue,
  readOnly,
}: EditableFieldProps) {
  const key = storageKey(engagementId, fieldKey);
  const [value, setValue] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw ?? defaultValue ?? "");
    } catch {
      setValue(defaultValue ?? "");
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {}
  }, [loaded, key, value]);

  if (readOnly) {
    return (
      <span className={`whitespace-pre-wrap break-words ${className ?? ""}`}>
        {value || placeholder || "\u00A0"}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        className={`w-full bg-yellow-50/40 print:bg-transparent border-b border-dashed border-black/40 print:border-black/50 outline-none focus:bg-yellow-100/60 focus:ring-0 px-1 py-0.5 text-xs leading-snug resize-y print:resize-none ${className ?? ""}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={`bg-yellow-50/40 print:bg-transparent border-b border-dashed border-black/40 print:border-black/50 outline-none focus:bg-yellow-100/60 focus:ring-0 px-1 text-xs ${className ?? ""}`}
    />
  );
}
