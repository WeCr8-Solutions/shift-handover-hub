import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { StationAlertTile } from "./StationAlertTile";

interface ActiveStation {
  id: string;
  dbId: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
  workCenter: string | undefined;
  workCenterType: string | undefined;
  operator: string;
  workOrder: string;
  partNumber: string;
  progress: number;
  status: string;
}

interface StationListTableProps {
  activeStations: ActiveStation[];
  onViewStation?: (stationId: string, stationName: string) => void;
}

export function StationListTable({ activeStations, onViewStation }: StationListTableProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Active Stations</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Live • Auto-refresh
          </Badge>
        </div>
      </div>
      {activeStations.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No stations configured.{" "}
          <button onClick={() => navigate("/teams")} className="text-primary underline">
            Add stations
          </button>
        </div>
      ) : (
        <div>
          {activeStations.map((station) => (
            <StationAlertTile
              key={station.dbId}
              station={station}
              onViewStation={onViewStation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
