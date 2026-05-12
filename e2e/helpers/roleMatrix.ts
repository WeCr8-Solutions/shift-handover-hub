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
  | "admin";

export interface RoleEntry {
  role: Role;
  /** Which seeded user to log in as. */
  loginAs: "operator" | "admin";
  /** Routes to nav-audit for dead-ends. */
  navRoutes: string[];
  /** Default scenarios this role exercises. */
  scenarios: SeedScenario[];
  /** Pathways this role is responsible for. */
  pathways: Pathway[];
}

export const ROLE_MATRIX: Record<Role, RoleEntry> = {
  operator: {
    role: "operator",
    loginAs: "operator",
    navRoutes: [
      "/dashboard",
      "/queue",
      "/handoff",
      "/operator-tools",
      "/oap",
      "/gca",
      "/notifications",
    ],
    scenarios: ["wo_basic", "handoff_chain", "ncr_path"],
    pathways: ["wo", "handoff", "ncr", "notifications", "nav", "gca", "oap"] as Pathway[],
  },
  supervisor: {
    role: "supervisor",
    loginAs: "admin",
    navRoutes: [
      "/dashboard",
      "/queue",
      "/work-orders",
      "/work-orders/cancelled",
      "/teams",
      "/handoff",
      "/notifications",
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
      "/settings/integrations/native",
      "/teams",
      "/billing",
      "/admin/users",
    ],
    scenarios: ["wo_basic"],
    pathways: ["nav", "billing", "admin"],
  },
  platform_admin: {
    role: "platform_admin",
    loginAs: "admin",
    navRoutes: ["/dev", "/admin/users", "/admin/orgs"],
    scenarios: ["wo_basic"],
    pathways: ["nav", "admin"],
  },
  talent: {
    role: "talent",
    loginAs: "operator",
    navRoutes: ["/talent/dashboard", "/talent/profile", "/talent"],
    scenarios: ["wo_basic"],
    pathways: ["nav", "talent"],
  },
};
