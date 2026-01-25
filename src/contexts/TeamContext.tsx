import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useTeams, Team } from "@/hooks/useTeams";

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
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  // Auto-select first team when teams load
  useEffect(() => {
    if (!loading && teams.length > 0 && !currentTeam) {
      // Try to restore from localStorage
      const savedTeamId = localStorage.getItem("selectedTeamId");
      const savedTeam = teams.find((t) => t.id === savedTeamId);
      setCurrentTeam(savedTeam || teams[0]);
    }
  }, [teams, loading, currentTeam]);

  // Clear team when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentTeam(null);
    }
  }, [user]);

  // Save selection to localStorage
  const handleSetCurrentTeam = (team: Team | null) => {
    setCurrentTeam(team);
    if (team) {
      localStorage.setItem("selectedTeamId", team.id);
    } else {
      localStorage.removeItem("selectedTeamId");
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
