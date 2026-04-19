import { useEffect, useRef } from "react";
import { issueReporterRegistry, type ModuleContextSnapshot } from "@/lib/issueReporter";

/**
 * Register a module's diagnostic context with the issue reporter.
 * The hook keeps the latest snapshot in a ref, so updates between
 * renders are picked up without re-registering.
 *
 * @example
 * useModuleContext({
 *   id: "queue",
 *   label: "Production Queue",
 *   data: { stationId, view, filters },
 * });
 */
export function useModuleContext(snapshot: Omit<ModuleContextSnapshot, "id"> & { id: string }) {
  const latest = useRef(snapshot);
  latest.current = snapshot;

  useEffect(() => {
    const unregister = issueReporterRegistry.register(snapshot.id, () => ({
      ...latest.current,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
    }));
    return unregister;
    // We intentionally only re-run on id change — data updates flow via the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.id]);
}
