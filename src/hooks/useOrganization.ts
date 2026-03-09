/**
 * src/hooks/useOrganization.ts
 *
 * Convenience alias for useOrgContext().
 * Returns the current user's organization, org role, teams, and loading state.
 * All org-scoped hooks should derive org data from this (or useOrgContext directly).
 */

import { useOrgContext } from "@/contexts/OrgContext";

export function useOrganization() {
  const {
    organization,
    organizationRole,
    teams,
    userRoles,
    primaryRole,
    primaryTeam,
    loading,
    refresh,
  } = useOrgContext();

  return {
    organization,
    organizationId: organization?.id ?? null,
    organizationRole,
    teams,
    userRoles,
    primaryRole,
    primaryTeam,
    loading,
    refresh,
  };
}
