import { ReactNode } from "react";
import { useModuleContext } from "@/hooks/useModuleContext";
import type { ModuleSeverityHint } from "@/lib/issueReporter/registry";

interface ModuleScopeProps {
  /** Stable module id, e.g. "queue", "settings/notifications" */
  id: string;
  /** Human label shown in bug reports */
  label: string;
  /** Arbitrary structured data — entity IDs, filters, mode */
  data?: Record<string, unknown>;
  /** Health hint surfaced in the dialog */
  health?: ModuleSeverityHint;
  children: ReactNode;
}

/**
 * Declarative wrapper that registers a page/feature with the issue
 * reporter registry for the duration of its mount. When users open
 * the bug reporter, the most recent ModuleScope context is bundled
 * automatically — no per-page wiring inside the dialog.
 */
export function ModuleScope({ id, label, data, health, children }: ModuleScopeProps) {
  useModuleContext({ id, label, data: data ?? {}, health });
  return <>{children}</>;
}
