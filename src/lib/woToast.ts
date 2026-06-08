/**
 * woToast — unified toast helper for Work Order surfaces.
 *
 * Wraps `sonner` so every WO action ends with a consistent confirmation:
 *   - WO number is auto-prefixed into the title when supplied
 *   - Semantic durations (success 3s, error 6s, blocked 5s, info 3s)
 *   - One place to tweak copy / iconography across the queue, admin, and
 *     routing surfaces.
 *
 * Usage:
 *   woToast.success("Work order completed", "WO-123");
 *   woToast.error("Failed to advance", err.message, "WO-123");
 *   woToast.blocked("Quality sign-off required", "QA must approve before advancing");
 *   woToast.info("WO-123 copied to clipboard");
 *   await woToast.promise(rpcPromise, { loading: "Saving…", success: "Saved", error: "Save failed" });
 */
import { toast } from "sonner";

const SUCCESS_MS = 3000;
const ERROR_MS = 6000;
const BLOCKED_MS = 5000;
const INFO_MS = 3000;

function withWo(label: string, woNumber?: string | null): string {
  const wo = woNumber?.trim();
  return wo ? `${label} · ${wo}` : label;
}

export const woToast = {
  /** Successful completion of a WO action. */
  success(action: string, woNumber?: string | null, description?: string) {
    return toast.success(withWo(action, woNumber), {
      description,
      duration: SUCCESS_MS,
    });
  },

  /** Server / RPC / network error. */
  error(action: string, message?: string, woNumber?: string | null) {
    return toast.error(withWo(action, woNumber), {
      description: message,
      duration: ERROR_MS,
    });
  },

  /**
   * State-machine blocked: QA gate, first-article pending, missing
   * permissions, etc. Semantically a "warning" — uses sonner's warning.
   */
  blocked(reason: string, hint?: string, woNumber?: string | null) {
    return toast.warning(withWo(reason, woNumber), {
      description: hint,
      duration: BLOCKED_MS,
    });
  },

  /** Neutral informational notice (clone, copy, queued, etc.). */
  info(message: string, description?: string) {
    return toast(message, {
      description,
      duration: INFO_MS,
    });
  },

  /** Async wrapper — shows loading → success/error. */
  promise<T>(
    p: Promise<T>,
    opts: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((err: unknown) => string);
      woNumber?: string | null;
    },
  ) {
    return toast.promise(p, {
      loading: withWo(opts.loading, opts.woNumber),
      success: (value) =>
        withWo(
          typeof opts.success === "function" ? opts.success(value) : opts.success,
          opts.woNumber,
        ),
      error: (err) =>
        withWo(
          typeof opts.error === "function" ? opts.error(err) : opts.error,
          opts.woNumber,
        ),
    });
  },

  /** Dismiss a toast by id (passthrough). */
  dismiss(id?: string | number) {
    return toast.dismiss(id);
  },
};
