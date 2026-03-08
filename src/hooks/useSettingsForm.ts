import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";

export interface UseSettingsFormOptions<T extends Record<string, unknown>> {
  /** The key used in app_settings table */
  settingKey: string;
  /** Default values when no saved setting exists */
  defaults: T;
  /** Setting type for categorization (default: "general") */
  settingType?: string;
  /** Custom success message */
  successMessage?: string;
}

export interface UseSettingsFormReturn<T extends Record<string, unknown>> {
  /** Current form state */
  form: T;
  /** Update a single field */
  update: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Batch update multiple fields */
  setForm: React.Dispatch<React.SetStateAction<T>>;
  /** Whether form has unsaved changes */
  isDirty: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether data is still loading from the backend */
  loading: boolean;
  /** Persist current form state to backend */
  save: () => Promise<void>;
  /** Revert form to last-saved state */
  discard: () => void;
}

/**
 * Reusable hook for settings form lifecycle.
 *
 * Handles: load from `app_settings` → local form state → dirty tracking → save → toast.
 * Eliminates ~40 lines of boilerplate per settings component.
 *
 * @example
 * ```tsx
 * const { form, update, isDirty, isSaving, save, discard, loading } =
 *   useSettingsForm({ settingKey: "general_preferences", defaults: DEFAULT_SETTINGS });
 *
 * // Read a value
 * form.timezone
 *
 * // Update a value
 * update("timezone", "America/Chicago")
 *
 * // Save
 * await save()
 * ```
 */
export function useSettingsForm<T extends Record<string, unknown>>({
  settingKey,
  defaults,
  settingType = "general",
  successMessage = "Settings saved",
}: UseSettingsFormOptions<T>): UseSettingsFormReturn<T> {
  const { toast } = useToast();
  const { getSetting, updateSetting, loading } = useGeneralSettings();

  const [form, setForm] = useState<T>(defaults);
  const [initial, setInitial] = useState<T>(defaults);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form state when settings load from the backend
  const loadFromBackend = useCallback(() => {
    const saved = getSetting(settingKey);
    if (saved && typeof saved === "object") {
      const merged = { ...defaults, ...saved } as T;
      setForm(merged);
      setInitial(merged);
    }
  }, [getSetting, settingKey, defaults]);

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const { error } = await updateSetting(
        settingKey,
        form as Record<string, unknown>,
        settingType,
      );
      if (error) {
        toast({
          title: "Failed to save settings",
          description: error,
          variant: "destructive",
        });
      } else {
        setInitial(form);
        toast({ title: successMessage });
      }
    } finally {
      setIsSaving(false);
    }
  }, [form, settingKey, settingType, successMessage, toast, updateSetting]);

  const discard = useCallback(() => {
    setForm(initial);
  }, [initial]);

  return {
    form,
    update,
    setForm,
    isDirty,
    isSaving,
    loading,
    save,
    discard,
  };
}
