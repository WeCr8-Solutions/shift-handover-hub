import { useCurrentTeam } from "@/contexts/TeamContext";
import { useTeams, Team } from "@/hooks/useTeams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Building2 } from "lucide-react";

export function TeamSelector() {
  const { currentTeam, setCurrentTeam, teams, loading } = useCurrentTeam();

  if (loading) {
    return (
      <div className="w-40 h-9 bg-secondary/50 rounded-md animate-pulse" />
    );
  }

  if (teams.length === 0) {
    return null;
  }

  return (
    <Select
      value={currentTeam?.id || "personal"}
      onValueChange={(value) => {
        if (value === "personal") {
          setCurrentTeam(null);
        } else {
          const team = teams.find((t) => t.id === value);
          setCurrentTeam(team || null);
        }
      }}
    >
      <SelectTrigger className="w-48 h-9 bg-secondary/50 border-border">
        <div className="flex items-center gap-2">
          {currentTeam ? (
            <Users className="w-4 h-4 text-primary" />
          ) : (
            <Building2 className="w-4 h-4 text-muted-foreground" />
          )}
          <SelectValue placeholder="Select workspace" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="personal">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Personal Workspace
          </div>
        </SelectItem>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {team.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
