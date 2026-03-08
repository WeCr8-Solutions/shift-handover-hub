import React from "react";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Factory } from "lucide-react";

export const TeamSelector = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function TeamSelector(props, ref) {
  const { currentTeam, setCurrentTeam, teams, loading } = useCurrentTeam();
  const { organization } = useUserOrganization();

  if (loading) {
    return (
      <div className="w-40 h-9 bg-secondary/50 rounded-md animate-pulse" />
    );
  }

  if (teams.length === 0) {
    return null;
  }

  const orgLabel = organization?.name
    ? `${organization.name} · All Teams`
    : "All Teams";

  return (
    <div ref={ref} {...props}>
      value={currentTeam?.id || "all-teams"}
      onValueChange={(value) => {
        if (value === "all-teams") {
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
            <Factory className="w-4 h-4 text-primary" />
          )}
          <SelectValue placeholder="Select workspace" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all-teams">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            {orgLabel}
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
    </div>
  );
});

TeamSelector.displayName = "TeamSelector";
