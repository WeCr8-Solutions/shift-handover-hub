import type { SeedScenario } from "./seed";

export type Role =
  | "operator"
  | "supervisor"
  | "org_admin"
  | "platform_admin"
  | "talent";

export type Pathway =
  | "wo"
  | "routing"
  | "ncr"
  | "quarantine"
  | "notifications"
  | "nav"
  | "gca"
  | "oap"
  | "talent"
  | "billing"
  | "admin"
  | "handoff";

export interface RoleEntry {
  role: Role;
  /** Which seeded user to log in as. */
  loginAs: "operator" | "admin";
  /** Routes to nav-audit for dead-ends. Must match real routes mounted in src/App.tsx. */
  navRoutes: string[];
  /** Default scenarios this role exercises. */
  scenarios: SeedScenario[];
  /** Pathways this role is responsible for. */
  pathways: Pathway[];
}

/**
 * IMPORTANT: Every path here MUST be mounted in src/App.tsx. If a route is
 * removed from the app, remove it here too — the usability matrix asserts
 * anonymous bounce → /auth, and a missing route renders 404 instead which
 * fails the assertion.
 *
 * Last reconciled with src/App.tsx on 2026-05-13.
 */
export const ROLE_MATRIX: Record<Role, RoleEntry> = {
  operator: {
    role: "operator",
    loginAs: "operator",
    navRoutes: [
      "/dashboard",
      "/queue",
      "/work-orders",
      "/tools",
      "/oap",
      "/gcode-academy",
    ],
    scenarios: ["wo_basic", "handoff_chain", "ncr_path"],
    pathways: ["wo", "handoff", "ncr", "notifications", "nav", "gca", "oap"],
  },
  supervisor: {
    role: "supervisor",
    loginAs: "admin",
    navRoutes: [
      "/dashboard",
      "/queue",
      "/work-orders",
      "/work-orders/cancelled",
      "/work-orders/completed",
      "/work-orders/on-hold",
      "/teams",
      "/admin",
    ],
    scenarios: ["wo_routed", "ncr_path"],
    pathways: ["wo", "routing", "ncr", "quarantine", "notifications", "nav"],
  },
  org_admin: {
    role: "org_admin",
    loginAs: "admin",
    navRoutes: [
      "/dashboard",
      "/settings",
      "/teams",
      "/admin",
    ],
    scenarios: ["wo_basic"],
    pathways: ["nav", "billing", "admin"],
  },
  platform_admin: {
    role: "platform_admin",
    loginAs: "admin",
    navRoutes: ["/dev", "/admin", "/testing"],
    scenarios: ["wo_basic"],
    pathways: ["nav", "admin", "billing"],
  },
  talent: {
    role: "talent",
    loginAs: "operator",
    navRoutes: ["/talent/dashboard", "/operator/profile", "/talent"],
    scenarios: ["wo_basic"],
    pathways: ["nav", "talent"],
  },
};
