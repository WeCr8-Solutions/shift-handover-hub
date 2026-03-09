/**
 * Structured access object passed to admin components.
 * Replaces the ambiguous `isAdmin: boolean` prop pattern.
 * See PRD 22 §5.2 for rationale.
 */
export interface AdminComponentAccess {
  /** Global cross-org access (platform admin only) */
  isPlatformAdmin: boolean;
  /** Can manage org members, teams, stations, settings */
  canManageOrg: boolean;
  /** Supervisor+ production oversight */
  canManageProduction: boolean;
  /** The scoped organization ID, null for platform-wide view */
  organizationId: string | null;
}
