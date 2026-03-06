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
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { getCurrentShift } from "@/lib/mockData";
import { LogOut, Loader2, Clock, ArrowLeft, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OperatorDashboardProps {
  isAdminView?: boolean;
  onBackToOverview?: () => void;
}

export function OperatorDashboard({ isAdminView, onBackToOverview }: OperatorDashboardProps = {}) {
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { activeSessions, loading, isCheckedIn, checkIn, checkOut } = useOperatorSessions();
  const { createHandoffRecord } = useHandoffRecords(currentTeam?.id, organization?.id);

  const [showHandoff, setShowHandoff] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [handoffStationId, setHandoffStationId] = useState<string>();
  const [endingShift, setEndingShift] = useState(false);

  const handleEndShift = async () => {
    if (endingShift) return;
    setEndingShift(true);
    await checkOut();
    setEndingShift(false);
  };

  const handleOpenHandoff = (stationId: string) => {
    setHandoffStationId(stationId);
    setShowHandoff(true);
  };

  const handleCloseHandoff = () => {
    setShowHandoff(false);
    setHandoffStationId(undefined);
  };

  const handleOpenPerformance = () => setShowPerformance(true);
  const handleClosePerformance = () => setShowPerformance(false);

  const activeStationCount = activeSessions.length;
  const hasSingleStation = activeStationCount === 1;

  // Only show full-page spinner on initial load (no sessions fetched yet)
  if (loading && activeStationCount === 0 && !isCheckedIn) {
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

  return (
    <div className="space-y-6">
      {isAdminView && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Viewing as operator — you can check in to stations and complete tasks from here.</span>
            {onBackToOverview && (
              <Button variant="ghost" size="sm" onClick={onBackToOverview} className="gap-2 shrink-0">
                <ArrowLeft className="w-4 h-4" />
                Back to overview
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {getCurrentShift()} Shift
          </Badge>
          <span className="text-sm text-muted-foreground">
            {activeStationCount} station
            {activeStationCount !== 1 ? "s" : ""}
            {" active"}
          </span>
        </div>
        <Button variant="destructive" size="sm" className="gap-2" onClick={handleEndShift} disabled={endingShift}>
          {endingShift ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {endingShift ? "Ending shift…" : "End shift"}
        </Button>
      </div>

      {/* Station panels */}
      {hasSingleStation ? (
        <OperatorStationPanel
          stationId={activeSessions[0].station_id}
          stationName={activeSessions[0].station?.name || "Station"}
          onCreateHandoff={() => handleOpenHandoff(activeSessions[0].station_id)}
          onPerformanceUpdate={handleOpenPerformance}
        />
      ) : (
        <Tabs defaultValue={activeSessions[0].station_id} className="space-y-4">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
            {activeSessions.map((session) => (
              <TabsTrigger key={session.station_id} value={session.station_id} className="text-xs">
                {session.station?.name || session.station_id}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeSessions.map((session) => (
            <TabsContent key={session.station_id} value={session.station_id}>
              <OperatorStationPanel
                stationId={session.station_id}
                stationName={session.station?.name || "Station"}
                onCreateHandoff={() => handleOpenHandoff(session.station_id)}
                onPerformanceUpdate={handleOpenPerformance}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Handoff modal */}
      {showHandoff && (
        <NewHandoffForm
          onClose={handleCloseHandoff}
          onSubmit={createHandoffRecord}
          initialStationId={handoffStationId}
        />
      )}

      {/* Performance update modal */}
      {showPerformance && <JobPerformanceUpdateForm onClose={handleClosePerformance} />}
    </div>
  );
}
