import { Activity, AlertTriangle, Wrench, Clock, Pause } from "lucide-react";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, useHandoffRecords } from "@/hooks/useStations";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { mockStations, mockHandoffRecords } from "@/lib/mockData";
import { useMemo } from "react";
import { getStatusFromJobState } from "@/components/dashboard/stationStatus";

export function ShiftStats() {
  const { user } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { stations: dbStations, loading: stationsLoading } = useStations(currentTeam?.id, organization?.id);
  const { records: dbRecords, loading: recordsLoading } = useHandoffRecords(currentTeam?.id, organization?.id);

  // Use database data when logged in, mock data when not
  const stations = useMemo(() => {
    if (!user) return mockStations;
    return dbStations.map((s) => ({
      ...s,
      currentJob: s.current_status ? {
        state: s.current_status.current_job_state,
      } : undefined,
    }));
  }, [user, dbStations]);

  const handoffRecords = useMemo(() => {
    if (!user) return mockHandoffRecords;
    return dbRecords;
  }, [user, dbRecords]);

  const runningStations = stations.filter(
    (s: any) => {
      const status = getStatusFromJobState(s.currentJob?.state);
      return status === "running";
    }
  ).length;
  
  const downStations = stations.filter(
    (s: any) => getStatusFromJobState(s.currentJob?.state) === "down"
  ).length;
  
  const setupStations = stations.filter(
    (s: any) => getStatusFromJobState(s.currentJob?.state) === "setup"
  ).length;

  const waitingStations = stations.filter(
    (s: any) => getStatusFromJobState(s.currentJob?.state) === "waiting"
  ).length;

  const pendingHandoffs = handoffRecords.length;

  const isLoading = user && (stationsLoading || recordsLoading);

  const stats = [
    {
      label: "Running",
      value: runningStations,
      total: stations.length,
      icon: Activity,
      color: "text-status-ok",
      bgColor: "bg-status-ok/10",
    },
    {
      label: "Down",
      value: downStations,
      total: stations.length,
      icon: AlertTriangle,
      color: "text-status-critical",
      bgColor: "bg-status-critical/10",
    },
    {
      label: "In Setup",
      value: setupStations,
      total: stations.length,
      icon: Wrench,
      color: "text-status-warning",
      bgColor: "bg-status-warning/10",
    },
    {
      label: "Waiting",
      value: waitingStations,
      total: stations.length,
      icon: Pause,
      color: "text-status-waiting",
      bgColor: "bg-status-waiting/10",
    },
    {
      label: "Recent Handoffs",
      value: pendingHandoffs,
      icon: Clock,
      color: "text-status-info",
      bgColor: "bg-status-info/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-border rounded-lg p-4 bg-card"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {isLoading ? "..." : stat.value}
                {stat.total !== undefined && !isLoading && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stat.total}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
