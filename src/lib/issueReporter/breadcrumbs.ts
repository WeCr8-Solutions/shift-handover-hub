/**
 * Breadcrumb ring buffer for the issue reporter.
 * Captures recent user actions, route changes, and network failures
 * so developers can reproduce the exact sequence leading to a bug.
 */

export type BreadcrumbCategory =
  | "navigation"
  | "click"
  | "network"
  | "mutation"
  | "auth"
  | "custom";

export interface Breadcrumb {
  ts: string;
  category: BreadcrumbCategory;
  message: string;
  data?: Record<string, unknown>;
}

const MAX = 60;

class BreadcrumbBuffer {
  private items: Breadcrumb[] = [];

  add(b: Omit<Breadcrumb, "ts">) {
    this.items.push({ ...b, ts: new Date().toISOString() });
    if (this.items.length > MAX) this.items.splice(0, this.items.length - MAX);
  }

  snapshot(): Breadcrumb[] {
    return [...this.items];
  }

  clear() {
    this.items = [];
  }
}

export const breadcrumbs = new BreadcrumbBuffer();
