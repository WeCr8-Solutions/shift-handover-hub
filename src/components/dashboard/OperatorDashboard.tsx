import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperatorSessions } from "@/hooks/useOperatorSessions";
import { StationCheckIn } from "./StationCheckIn";
import { OperatorStationPanel } from "./OperatorStationPanel";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { JobPerformanceUpdateForm } from "@/components/JobPerformanceUpdateForm";
import { useHandoffRecords } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { getCurrentShift } from "@/lib/mockData";
import { LogOut, Loader2, Clock } from "lucide-react";

export function OperatorDashboard() {
  const { currentTeam } = useCurrentTeam();
  const { activeSessions, loading, isCheckedIn, checkIn, checkOut } =
    useOperatorSessions();
  const { createHandoffRecord } = useHandoffRecords(currentTeam?.id);

  const [showHandoff, setShowHandoff] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [handoffStationId, setHandoffStationId] = useState<string | undefined>();
  const [endingShift, setEndingShift] = useState(false);

  const handleEndShift = async () => {
    setEndingShift(true);
    await checkOut();
    setEndingShift(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not checked in — show station selection
  if (!isCheckedIn) {
    return <StationCheckIn onCheckIn={checkIn} />;
  }

  // Checked in — show work panels
  const singleStation = activeSessions.length === 1;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {getCurrentShift()} Shift
          </Badge>
          <span className="text-sm text-muted-foreground">
            {activeSessions.length} station{activeSessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={handleEndShift}
          disabled={endingShift}
        >
          {endingShift ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          End Shift
        </Button>
      </div>

      {/* Station panels */}
      {singleStation ? (
        <OperatorStationPanel
          stationId={activeSessions[0].station_id}
          stationName={activeSessions[0].station?.name || "Station"}
          onCreateHandoff={() => {
            setHandoffStationId(activeSessions[0].station_id);
            setShowHandoff(true);
          }}
          onPerformanceUpdate={() => setShowPerformance(true)}
        />
      ) : (
        <Tabs defaultValue={activeSessions[0].station_id} className="space-y-4">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
            {activeSessions.map((s) => (
              <TabsTrigger key={s.station_id} value={s.station_id} className="text-xs">
                {s.station?.name || s.station_id}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeSessions.map((s) => (
            <TabsContent key={s.station_id} value={s.station_id}>
              <OperatorStationPanel
                stationId={s.station_id}
                stationName={s.station?.name || "Station"}
                onCreateHandoff={() => {
                  setHandoffStationId(s.station_id);
                  setShowHandoff(true);
                }}
                onPerformanceUpdate={() => setShowPerformance(true)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Handoff modal */}
      {showHandoff && (
        <NewHandoffForm
          onClose={() => setShowHandoff(false)}
          onSubmit={createHandoffRecord}
        />
      )}

      {/* Performance update modal */}
      {showPerformance && (
        <JobPerformanceUpdateForm onClose={() => setShowPerformance(false)} />
      )}
    </div>
  );
}
