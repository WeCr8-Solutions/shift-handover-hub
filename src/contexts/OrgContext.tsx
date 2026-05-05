import { createContext, useContext, ReactNode } from "react";
import { useUserOrganization } from "@/hooks/useUserOrganization";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  requires_us_person_declaration?: boolean | null;
}

interface TeamMembership {
  id: string;
  team_id: string;
  role: string;
  joined_at: string;
  team: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface UserRole {
  id: string;
  role: string;
  created_at: string;
}

interface OrgContextType {
  organization: Organization | null;
  organizationRole: string | null;
  teams: TeamMembership[];
  userRoles: UserRole[];
  primaryRole: string;
  primaryTeam: TeamMembership | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const orgData = useUserOrganization();

  return (
    <OrgContext.Provider value={orgData}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrgContext must be used within an OrgProvider");
  }
  return context;
}
