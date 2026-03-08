import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useTeams, Team } from "@/hooks/useTeams";
import { useOrgContext } from "./OrgContext";

interface TeamContextType {
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  teams: Team[];
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { teams, loading } = useTeams();
  const { organizationRole, userRoles } = useOrgContext();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Determine if user has supervisor/admin level access
  const hasSupervisorAccess =
    organizationRole === "owner" ||
    organizationRole === "admin" ||
    organizationRole === "supervisor" ||
    userRoles.some((r) => r.role === "admin" || r.role === "developer" || r.role === "supervisor");

  // Auto-select on load
  useEffect(() => {
    if (!loading && teams.length > 0 && !initialized) {
      const savedTeamId = localStorage.getItem("selectedTeamId");

      if (savedTeamId === "__all_teams__") {
        setCurrentTeam(null);
      } else if (savedTeamId) {
        const savedTeam = teams.find((t) => t.id === savedTeamId);
        if (savedTeam) {
          setCurrentTeam(savedTeam);
        } else if (hasSupervisorAccess) {
          setCurrentTeam(null);
        } else {
          setCurrentTeam(teams[0]);
        }
      } else if (hasSupervisorAccess) {
        setCurrentTeam(null);
      } else {
        setCurrentTeam(teams[0]);
      }
      setInitialized(true);
    } else if (!loading && teams.length === 0 && !initialized) {
      setInitialized(true);
    }
  }, [teams, loading, initialized, hasSupervisorAccess]);

  // Clear team when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentTeam(null);
      setInitialized(false);
    }
  }, [user]);

  // Save selection to localStorage
  const handleSetCurrentTeam = (team: Team | null) => {
    setCurrentTeam(team);
    if (team) {
      localStorage.setItem("selectedTeamId", team.id);
    } else {
      localStorage.setItem("selectedTeamId", "__all_teams__");
    }
  };

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        setCurrentTeam: handleSetCurrentTeam,
        teams,
        loading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useCurrentTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useCurrentTeam must be used within a TeamProvider");
  }
  return context;
}
