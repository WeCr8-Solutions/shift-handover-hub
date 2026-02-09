import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DatabaseFunction {
  name: string;
  arguments: string;
  returnType: string;
  description: string;
  category: "role-check" | "org-check" | "team-check" | "feature-check" | "utility";
}

export interface RLSPolicy {
  table: string;
  policyName: string;
  command: string;
  roles: string[];
  using?: string;
  withCheck?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  scope: "platform" | "organization" | "team" | "app";
  table: string;
  column: string;
  description: string;
  capabilities: string[];
  restrictions: string[];
  helperFunctions: string[];
  rlsAccess: { table: string; operations: string }[];
}

// Static role definitions based on current codebase
export const roleDefinitions: RoleDefinition[] = [
  // Platform Level Roles (user_roles table)
  {
    id: "admin",
    name: "Platform Admin",
    scope: "platform",
    table: "user_roles",
    column: "role = 'admin'",
    description: "Full platform access, reserved for system owner only",
    capabilities: [
      "Access all organizations globally",
      "Manage platform-wide settings",
      "View global activity logs",
      "Assign developer roles to users",
      "Access admin panel (/admin)",
      "Manage all issues and dev queue",
      "View all subscriptions and billing"
    ],
    restrictions: ["Cannot be assigned via UI - system only"],
    helperFunctions: ["has_role(uid, 'admin')", "is_dev_or_admin(uid)"],
    rlsAccess: [
      { table: "user_roles", operations: "ALL (full access)" },
      { table: "activity_logs", operations: "SELECT (all)" },
      { table: "issues", operations: "ALL (full access)" },
      { table: "dev_issue_queue", operations: "ALL (full access)" },
      { table: "organizations", operations: "SELECT (all)" }
    ]
  },
  {
    id: "developer",
    name: "Developer",
    scope: "platform",
    table: "user_roles",
    column: "role = 'developer'",
    description: "Testing tools, debugging, API access for development",
    capabilities: [
      "Access Testing panel (/testing)",
      "View debug information",
      "Run test suites and process tests",
      "Access RLS health checks",
      "View dev issue queue (assigned)",
      "Access API documentation"
    ],
    restrictions: ["Cannot manage billing", "Cannot delete organizations"],
    helperFunctions: ["has_role(uid, 'developer')", "is_dev_or_admin(uid)"],
    rlsAccess: [
      { table: "rls_health_checks", operations: "SELECT/INSERT" },
      { table: "process_tests", operations: "ALL" },
      { table: "test_runs", operations: "ALL" },
      { table: "dev_issue_queue", operations: "SELECT/UPDATE (assigned)" }
    ]
  },
  {
    id: "supervisor",
    name: "Supervisor",
    scope: "app",
    table: "user_roles",
    column: "role = 'supervisor'",
    description: "Production oversight, expediting, approval authority",
    capabilities: [
      "Approve/reject job performance updates",
      "Override work order assignments",
      "View team analytics and metrics",
      "Manage station assignments",
      "Expedite work orders",
      "View handoff records for supervised teams"
    ],
    restrictions: ["Scoped to organization membership", "Cannot manage users or billing"],
    helperFunctions: ["has_role(uid, 'supervisor')", "is_supervisor_for_team(uid, team_id)", "is_supervisor_in_org(uid, org_id)"],
    rlsAccess: [
      { table: "job_performance_updates", operations: "UPDATE (status)" },
      { table: "queue_items", operations: "UPDATE (priority, assignment)" },
      { table: "work_order_routing", operations: "UPDATE" },
      { table: "handoff_records", operations: "SELECT (team)" }
    ]
  },
  {
    id: "operator",
    name: "Operator",
    scope: "app",
    table: "user_roles",
    column: "role = 'operator'",
    description: "Shop floor execution - default role for all new users",
    capabilities: [
      "Submit handoff records",
      "Update work order status (assigned)",
      "Submit performance updates",
      "View assigned stations",
      "Clock in/out at stations",
      "Report issues"
    ],
    restrictions: [
      "Cannot approve performance updates",
      "Cannot override assignments",
      "Cannot access admin panels",
      "Scoped to team membership"
    ],
    helperFunctions: ["has_role(uid, 'operator')"],
    rlsAccess: [
      { table: "handoff_records", operations: "INSERT/SELECT (own)" },
      { table: "queue_items", operations: "SELECT (assigned station)" },
      { table: "job_performance_updates", operations: "INSERT (own)" },
      { table: "current_station_status", operations: "UPDATE (assigned)" },
      { table: "stations", operations: "SELECT (team)" }
    ]
  },
  {
    id: "viewer",
    name: "Viewer",
    scope: "app",
    table: "user_roles",
    column: "role = 'viewer'",
    description: "Read-only dashboards and reports",
    capabilities: [
      "View dashboards",
      "View queue status",
      "View handoff history",
      "View station statuses",
      "Export reports (if entitled)"
    ],
    restrictions: [
      "Cannot submit handoffs",
      "Cannot update work orders",
      "Cannot submit performance updates",
      "Read-only access only"
    ],
    helperFunctions: ["has_role(uid, 'viewer')"],
    rlsAccess: [
      { table: "stations", operations: "SELECT (org)" },
      { table: "queue_items", operations: "SELECT (org)" },
      { table: "handoff_records", operations: "SELECT (org)" }
    ]
  },
  // Organization Level Roles (organization_members table)
  {
    id: "org_owner",
    name: "Org Owner",
    scope: "organization",
    table: "organization_members",
    column: "role = 'owner'",
    description: "Full organization control, billing, and deletion rights",
    capabilities: [
      "Manage billing and subscription",
      "Delete organization",
      "Transfer ownership",
      "All admin capabilities",
      "Generate API keys",
      "Manage feature flags"
    ],
    restrictions: ["One per organization", "Cannot be removed except by transfer"],
    helperFunctions: ["is_org_admin(uid, org_id)", "is_org_member(uid, org_id)"],
    rlsAccess: [
      { table: "organizations", operations: "ALL" },
      { table: "organization_members", operations: "ALL" },
      { table: "subscriptions", operations: "ALL" },
      { table: "entitlements", operations: "ALL" },
      { table: "organization_api_keys", operations: "ALL" }
    ]
  },
  {
    id: "org_admin",
    name: "Org Admin",
    scope: "organization",
    table: "organization_members",
    column: "role = 'admin'",
    description: "Organization management (except billing/delete)",
    capabilities: [
      "Create and manage teams",
      "Invite and remove members",
      "Generate invite codes",
      "Assign org-level app roles (supervisor/operator/viewer)",
      "Manage stations and work centers",
      "View organization analytics"
    ],
    restrictions: ["Cannot manage billing", "Cannot delete organization", "Cannot assign admin/developer roles"],
    helperFunctions: ["is_org_admin(uid, org_id)", "is_org_member(uid, org_id)", "is_org_assignable_role(role)"],
    rlsAccess: [
      { table: "teams", operations: "ALL (within org)" },
      { table: "team_members", operations: "ALL (within org)" },
      { table: "organization_invites", operations: "ALL (within org)" },
      { table: "stations", operations: "ALL (within org)" },
      { table: "user_roles", operations: "INSERT/DELETE (org-assignable roles only)" }
    ]
  },
  {
    id: "org_member",
    name: "Org Member",
    scope: "organization",
    table: "organization_members",
    column: "role = 'member'",
    description: "Standard organization member, capabilities defined by app_role",
    capabilities: [
      "Join teams when invited",
      "Access organization resources",
      "Capabilities defined by app_role (operator/supervisor/viewer)"
    ],
    restrictions: ["Cannot manage organization", "Cannot invite users", "Limited to app_role permissions"],
    helperFunctions: ["is_org_member(uid, org_id)"],
    rlsAccess: [
      { table: "teams", operations: "SELECT (org)" },
      { table: "stations", operations: "SELECT (org)" }
    ]
  },
  // Team Level Roles (team_members table)
  {
    id: "team_owner",
    name: "Team Owner",
    scope: "team",
    table: "team_members",
    column: "role = 'owner'",
    description: "Full team control, created when team is created",
    capabilities: [
      "Delete team",
      "Transfer ownership",
      "All team admin capabilities"
    ],
    restrictions: ["One per team"],
    helperFunctions: ["is_team_admin(uid, team_id)", "is_team_member(uid, team_id)"],
    rlsAccess: [
      { table: "teams", operations: "UPDATE/DELETE (own team)" },
      { table: "team_members", operations: "ALL (own team)" }
    ]
  },
  {
    id: "team_admin",
    name: "Team Admin",
    scope: "team",
    table: "team_members",
    column: "role = 'admin'",
    description: "Team administration and member management",
    capabilities: [
      "Add/remove team members",
      "Manage team settings",
      "Assign team roles"
    ],
    restrictions: ["Cannot delete team"],
    helperFunctions: ["is_team_admin(uid, team_id)", "is_team_member(uid, team_id)"],
    rlsAccess: [
      { table: "team_members", operations: "INSERT/UPDATE/DELETE (team)" },
      { table: "stations", operations: "UPDATE (team)" }
    ]
  },
  {
    id: "team_member",
    name: "Team Member",
    scope: "team",
    table: "team_members",
    column: "role = 'member'",
    description: "Standard team participation",
    capabilities: [
      "Participate in team work",
      "View team resources",
      "Access assigned stations"
    ],
    restrictions: ["Cannot manage team"],
    helperFunctions: ["is_team_member(uid, team_id)"],
    rlsAccess: [
      { table: "team_members", operations: "SELECT (team)" },
      { table: "stations", operations: "SELECT (team)" },
      { table: "handoff_records", operations: "SELECT/INSERT (team)" }
    ]
  }
];

// Database helper functions from current codebase
export const databaseFunctions: DatabaseFunction[] = [
  {
    name: "has_role",
    arguments: "_user_id UUID, _role app_role",
    returnType: "BOOLEAN",
    description: "Check if user has a specific platform/app role in user_roles table",
    category: "role-check"
  },
  {
    name: "is_dev_or_admin",
    arguments: "_user_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user is a developer or admin (platform-level access)",
    category: "role-check"
  },
  {
    name: "is_org_admin",
    arguments: "_user_id UUID, _org_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user is owner or admin of an organization",
    category: "org-check"
  },
  {
    name: "is_org_member",
    arguments: "_user_id UUID, _org_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user is a member of an organization (any role)",
    category: "org-check"
  },
  {
    name: "is_org_assignable_role",
    arguments: "_role app_role",
    returnType: "BOOLEAN",
    description: "Check if role can be assigned by org admins (supervisor/operator/viewer only)",
    category: "role-check"
  },
  {
    name: "is_in_same_org",
    arguments: "_caller_id UUID, _target_user_id UUID",
    returnType: "BOOLEAN",
    description: "Check if two users are in the same organization",
    category: "org-check"
  },
  {
    name: "get_user_org_id",
    arguments: "_user_id UUID",
    returnType: "UUID",
    description: "Get the organization ID for a user",
    category: "org-check"
  },
  {
    name: "is_team_admin",
    arguments: "_user_id UUID, _team_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user is owner or admin of a team",
    category: "team-check"
  },
  {
    name: "is_team_member",
    arguments: "_user_id UUID, _team_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user is a member of a team (any role)",
    category: "team-check"
  },
  {
    name: "is_supervisor_for_team",
    arguments: "_user_id UUID, _team_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user has supervisor role AND is member/org-member of team",
    category: "team-check"
  },
  {
    name: "is_supervisor_in_org",
    arguments: "_user_id UUID, _org_id UUID",
    returnType: "BOOLEAN",
    description: "Check if user has supervisor role AND is member of organization",
    category: "org-check"
  },
  {
    name: "check_feature_access",
    arguments: "_org_id UUID, _feature TEXT",
    returnType: "BOOLEAN",
    description: "Check if organization has access to a specific feature via entitlements",
    category: "feature-check"
  },
  {
    name: "check_limit_access",
    arguments: "_org_id UUID, _limit_key TEXT, _increment INT",
    returnType: "BOOLEAN",
    description: "Check if organization is within usage limits (stations, users, work_orders_per_month)",
    category: "feature-check"
  },
  {
    name: "is_feature_enabled",
    arguments: "_org_id UUID, _feature_key TEXT",
    returnType: "BOOLEAN",
    description: "Check if a feature flag is enabled for organization",
    category: "feature-check"
  },
  {
    name: "increment_usage",
    arguments: "_org_id UUID, _metric TEXT, _count INT",
    returnType: "VOID",
    description: "Increment usage counter for billing/limits tracking",
    category: "utility"
  },
  {
    name: "report_issue",
    arguments: "_title TEXT, _description TEXT, _severity issue_severity, ...",
    returnType: "UUID",
    description: "Create an issue report with auto-queue to dev team",
    category: "utility"
  },
  {
    name: "handle_new_user",
    arguments: "TRIGGER",
    returnType: "TRIGGER",
    description: "Auto-create profile, assign 'operator' role, init onboarding on signup",
    category: "utility"
  }
];

// Entitlements and limits
export interface EntitlementDefinition {
  key: string;
  type: "feature" | "limit";
  description: string;
  enforcedBy: string;
  plans: { [plan: string]: string | number | boolean };
}

export const entitlements: EntitlementDefinition[] = [
  {
    key: "stations",
    type: "limit",
    description: "Maximum number of stations per organization",
    enforcedBy: "check_limit_access() in RLS policy on stations INSERT",
    plans: { free: 3, pro: 25, enterprise: "unlimited" }
  },
  {
    key: "users",
    type: "limit",
    description: "Maximum number of users per organization",
    enforcedBy: "check_limit_access() in RLS policy on organization_members INSERT",
    plans: { free: 5, pro: 50, enterprise: "unlimited" }
  },
  {
    key: "work_orders_per_month",
    type: "limit",
    description: "Maximum work orders created per month",
    enforcedBy: "check_limit_access() in RLS policy on queue_items INSERT",
    plans: { free: 100, pro: 1000, enterprise: "unlimited" }
  },
  {
    key: "advanced_analytics",
    type: "feature",
    description: "Access to advanced analytics and reporting",
    enforcedBy: "check_feature_access() in UI EntitlementGate",
    plans: { free: false, pro: true, enterprise: true }
  },
  {
    key: "api_access",
    type: "feature",
    description: "Access to REST API and webhooks",
    enforcedBy: "check_feature_access() in edge functions",
    plans: { free: false, pro: true, enterprise: true }
  },
  {
    key: "custom_routing",
    type: "feature",
    description: "Custom work order routing templates",
    enforcedBy: "check_feature_access() in UI and RLS",
    plans: { free: false, pro: true, enterprise: true }
  },
  {
    key: "bulk_upload",
    type: "feature",
    description: "Bulk upload of work orders and stations",
    enforcedBy: "check_feature_access() in UI EntitlementGate",
    plans: { free: false, pro: true, enterprise: true }
  }
];

// Permission matrix showing what each role can do
export interface PermissionAction {
  action: string;
  admin: boolean;
  developer: boolean;
  supervisor: boolean;
  operator: boolean;
  viewer: boolean;
  orgOwner: boolean;
  orgAdmin: boolean;
}

export const permissionMatrix: PermissionAction[] = [
  { action: "View Dashboard", admin: true, developer: true, supervisor: true, operator: true, viewer: true, orgOwner: true, orgAdmin: true },
  { action: "Submit Handoff", admin: true, developer: true, supervisor: true, operator: true, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Create Work Order", admin: true, developer: true, supervisor: true, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Update Work Order Status", admin: true, developer: true, supervisor: true, operator: true, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Approve Performance Updates", admin: true, developer: false, supervisor: true, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Override Assignments", admin: true, developer: false, supervisor: true, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Manage Team Members", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Manage Stations", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Generate Invite Codes", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Assign App Roles", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Manage Billing", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: false },
  { action: "Delete Organization", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: false },
  { action: "Access Admin Panel", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: false, orgAdmin: false },
  { action: "Access Testing Panel", admin: true, developer: true, supervisor: false, operator: false, viewer: false, orgOwner: false, orgAdmin: false },
  { action: "Run RLS Health Checks", admin: true, developer: true, supervisor: false, operator: false, viewer: false, orgOwner: false, orgAdmin: false },
  { action: "View Activity Logs", admin: true, developer: true, supervisor: true, operator: false, viewer: false, orgOwner: true, orgAdmin: true },
  { action: "Submit Issues", admin: true, developer: true, supervisor: true, operator: true, viewer: true, orgOwner: true, orgAdmin: true },
  { action: "Manage Dev Queue", admin: true, developer: true, supervisor: false, operator: false, viewer: false, orgOwner: false, orgAdmin: false },
  { action: "View All Organizations", admin: true, developer: false, supervisor: false, operator: false, viewer: false, orgOwner: false, orgAdmin: false },
  { action: "Export Reports", admin: true, developer: true, supervisor: true, operator: false, viewer: true, orgOwner: true, orgAdmin: true },
  { action: "Manage API Keys", admin: true, developer: true, supervisor: false, operator: false, viewer: false, orgOwner: true, orgAdmin: false }
];

export function useRoleArchitecture() {
  const [loading, setLoading] = useState(false);

  return {
    roles: roleDefinitions,
    functions: databaseFunctions,
    entitlements,
    permissions: permissionMatrix,
    loading
  };
}
