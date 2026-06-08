import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperatorSessions } from "@/hooks/useOperatorSessions";
import { useBackgroundRefresh } from "@/hooks/useBackgroundRefresh";
import { useOrgRefreshInterval } from "@/hooks/useOrgRefreshInterval";
import { RefreshIndicator } from "./RefreshIndicator";
import { StationCheckIn } from "./StationCheckIn";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OperatorStationPanel } from "./OperatorStationPanel";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { JobPerformanceUpdateForm } from "@/components/JobPerformanceUpdateForm";
import { useHandoffRecords, useStations } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { getCurrentShift } from "@/lib/mockData";
import { LogOut, Loader2, Clock, ArrowLeft, Info, Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ComplimentaryAwardBanner } from "@/components/ComplimentaryAwardBanner";
import { OperatorMyNumbers } from "./OperatorMyNumbers";
import { AcknowledgeHandoffCard } from "./AcknowledgeHandoffCard";
import { QuickStatusDialog } from "@/components/handoff/QuickStatusDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface OperatorDashboardProps {
  isAdminView?: boolean;
  onBackToOverview?: () => void;
}

export function OperatorDashboard({ isAdminView, onBackToOverview }: OperatorDashboardProps) {
  const { currentTeam } = useCurrentTeam();
  const { organization } = useOrgContext();
  const { activeSessions, loading, isCheckedIn, checkIn, checkOut, refresh: refreshSessions } = useOperatorSessions();
  const { createHandoffRecord, refreshRecords, records: dbRecords } = useHandoffRecords(currentTeam?.id, organization?.id);
  const { stations: dbStations } = useStations(currentTeam?.id, organization?.id);

  // Org-configured background refresh — extended to 10min since realtime handles freshness
  const refreshIntervalMs = Math.max(useOrgRefreshInterval(), 600_000);
  const { isRefreshing, lastRefreshedAt, refresh: handleManualRefresh } =
    useBackgroundRefresh({
      key: `operator-${organization?.id}-${currentTeam?.id}`,
      fetchers: [
        () => refreshSessions?.() as unknown as Promise<unknown>,
        () => refreshRecords?.() as unknown as Promise<unknown>,
      ],
      intervalMs: refreshIntervalMs,
      enabled: !!(organization?.id) && isCheckedIn,
    });
  const [showHandoff, setShowHandoff] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [handoffStationId, setHandoffStationId] = useState<string | undefined>();
  const [endingShift, setEndingShift] = useState(false);
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
  const [quickStatusStationId, setQuickStatusStationId] = useState<string | null>(null);
  const [quickStatusStationName, setQuickStatusStationName] = useState<string>("");

  const handleEndShiftClick = () => {
    setShowEndShiftConfirm(true);
  };

  const handleEndShiftConfirm = async () => {
    setShowEndShiftConfirm(false);
    setEndingShift(true);
    try {
      await checkOut();
      toast.success("Shift ended successfully");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to end shift. Please try again.");
    } finally {
      setEndingShift(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Not checked in — show station selection
  if (!isCheckedIn) {
    return (
      <ErrorBoundary>
        <StationCheckIn onCheckIn={checkIn} />
      </ErrorBoundary>
    );
  }

  // Defensive check: checked in but sessions not loaded yet
  if (activeSessions.length === 0) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading stations">
        <Skeleton className="h-6 w-48" />
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Checked in — show work panels
  const singleStation = activeSessions.length === 1;

  return (
    <div className="space-y-6">
      {isAdminView && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Viewing as Operator — you can check in to stations and complete tasks from here.</span>
            {onBackToOverview && (
              <Button variant="ghost" size="sm" onClick={onBackToOverview} className="gap-2 ml-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Complimentary Access Alert */}
      <ComplimentaryAwardBanner />

      {/* Personal KPIs — last 7 days */}
      <OperatorMyNumbers />

      {/* Pending acknowledgements from prior shift */}
      <AcknowledgeHandoffCard stationIds={activeSessions.map((s) => s.station_id)} />




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
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshIndicator
            isRefreshing={isRefreshing}
            lastRefreshedAt={lastRefreshedAt}
            onRefresh={handleManualRefresh}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const first = activeSessions[0];
              setQuickStatusStationId(first.station_id);
              setQuickStatusStationName(first.station?.name || "Station");
            }}
            data-testid="quick-status-trigger"
            aria-label="Post a quick mid-shift status update"
          >
            <Radio className="w-4 h-4" />
            Quick Status
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleEndShiftClick}
            disabled={endingShift}
            aria-label={endingShift ? "Ending shift..." : "End shift"}
          >
            {endingShift ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            End Shift
          </Button>
        </div>
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

      {/* Shop Production Analytics — read-only for operators, populates as data grows */}
      <Suspense
        fallback={
          <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            Loading shop analytics…
          </div>
        }
      >
        <OperatorProductionAnalytics stations={dbStations} handoffs={dbRecords} />
      </Suspense>



      {/* Handoff modal */}
      {showHandoff && (
        <NewHandoffForm
          onClose={() => setShowHandoff(false)}
          onSubmit={createHandoffRecord}
          initialStationId={handoffStationId}
        />
      )}

      {/* Performance update modal */}
      {showPerformance && <JobPerformanceUpdateForm onClose={() => setShowPerformance(false)} />}

      {/* Quick Status (mid-shift) dialog */}
      {quickStatusStationId && (
        <QuickStatusDialog
          open={!!quickStatusStationId}
          onOpenChange={(open) => {
            if (!open) setQuickStatusStationId(null);
          }}
          stationId={quickStatusStationId}
          stationName={quickStatusStationName}
          onSaved={refreshSessions}
        />
      )}

      {/* End Shift Confirmation Dialog */}
      <AlertDialog open={showEndShiftConfirm} onOpenChange={setShowEndShiftConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End your shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will check you out of {activeSessions.length} station{activeSessions.length !== 1 ? "s" : ""}. Make
              sure you've completed any necessary handoff notes before ending your shift.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndShiftConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
