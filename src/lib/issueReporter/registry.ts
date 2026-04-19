/**
 * Issue Reporter Module Registry
 * ------------------------------
 * A singleton registry where pages and components can register
 * structured diagnostic context. When a user opens the bug reporter,
 * every active module's `getContext()` is collected and bundled with
 * the report so developers get rich, page-aware context automatically.
 *
 * Modules are stack-based by id — most recently mounted wins on conflict.
 */

export type ModuleSeverityHint = "info" | "warning" | "error";

export interface ModuleContextSnapshot {
  /** Stable module id, e.g. "queue", "settings/notifications", "handoff/new" */
  id: string;
  /** Human label shown in the report dialog */
  label: string;
  /** The route the module believes it's mounted on (for cross-check) */
  route?: string;
  /** Arbitrary structured data — entity IDs, filters, mode, etc. */
  data: Record<string, unknown>;
  /** Module-reported health hint */
  health?: ModuleSeverityHint;
}

export type ModuleContextProvider = () => ModuleContextSnapshot;

type Listener = () => void;

class IssueReporterRegistry {
  private providers = new Map<string, ModuleContextProvider>();
  private order: string[] = [];
  private listeners = new Set<Listener>();

  register(id: string, provider: ModuleContextProvider): () => void {
    this.providers.set(id, provider);
    this.order = [...this.order.filter((x) => x !== id), id];
    this.emit();
    return () => this.unregister(id);
  }

  unregister(id: string) {
    if (this.providers.delete(id)) {
      this.order = this.order.filter((x) => x !== id);
      this.emit();
    }
  }

  /** Snapshot every active module. Errors in a provider are isolated. */
  snapshot(): ModuleContextSnapshot[] {
    const out: ModuleContextSnapshot[] = [];
    for (const id of this.order) {
      const provider = this.providers.get(id);
      if (!provider) continue;
      try {
        out.push(provider());
      } catch (err) {
        out.push({
          id,
          label: id,
          data: { __providerError: err instanceof Error ? err.message : String(err) },
          health: "error",
        });
      }
    }
    return out;
  }

  activeIds(): string[] {
    return [...this.order];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* noop */
      }
    }
  }
}

export const issueReporterRegistry = new IssueReporterRegistry();
