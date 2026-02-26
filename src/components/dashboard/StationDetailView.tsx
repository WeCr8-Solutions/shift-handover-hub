import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperatorStationPanel } from "./OperatorStationPanel";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { JobPerformanceUpdateForm } from "@/components/JobPerformanceUpdateForm";
import { useHandoffRecords } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor } from "lucide-react";
import { useState } from "react";

interface StationDetailViewProps {
  stationId: string;
  stationName: string;
  onBack: () => void;
}

export function StationDetailView({ stationId, stationName, onBack }: StationDetailViewProps) {
  const navigate = useNavigate();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { createHandoffRecord } = useHandoffRecords(currentTeam?.id, organization?.id);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const handleViewWorkOrder = (orderId: string) => {
    navigate(`/queue?item=${orderId}`);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Production Floor
        </Button>
        <Badge variant="secondary" className="gap-1.5">
          <Monitor className="w-3 h-3" />
          Station Detail — {stationName}
        </Badge>
      </div>

      {/* Station panel */}
      <OperatorStationPanel
        stationId={stationId}
        stationName={stationName}
        onCreateHandoff={() => setShowHandoff(true)}
        onPerformanceUpdate={() => setShowPerformance(true)}
        onViewWorkOrder={handleViewWorkOrder}
      />

      {showHandoff && (
        <NewHandoffForm
          onClose={() => setShowHandoff(false)}
          onSubmit={createHandoffRecord}
          initialStationId={stationId}
        />
      )}

      {showPerformance && (
        <JobPerformanceUpdateForm onClose={() => setShowPerformance(false)} />
      )}
    </div>
  );
}
