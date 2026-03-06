import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperatorStationPanel } from "./OperatorStationPanel";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { JobPerformanceUpdateForm } from "@/components/JobPerformanceUpdateForm";
import { useHandoffRecords } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Loader2 } from "lucide-react";
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

interface StationDetailViewProps {
  stationId: string;
  stationName: string;
  onBack: () => void;
}

export function StationDetailView({ stationId, stationName, onBack }: StationDetailViewProps) {
  const navigate = useNavigate();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { createHandoffRecord, loading: handoffLoading } = useHandoffRecords(currentTeam?.id, organization?.id);

  const [showHandoff, setShowHandoff] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleViewWorkOrder = useCallback(
    (orderId: string) => {
      navigate(`/queue?item=${orderId}`);
    },
    [navigate],
  );

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    setHasUnsavedChanges(false);
    onBack();
  }, [onBack]);

  const handleOpenHandoff = useCallback(() => {
    setShowHandoff(true);
    setHasUnsavedChanges(true);
  }, []);

  const handleCloseHandoff = useCallback(() => {
    setShowHandoff(false);
    setHasUnsavedChanges(false);
  }, []);

  const handleOpenPerformance = useCallback(() => {
    setShowPerformance(true);
    setHasUnsavedChanges(true);
  }, []);

  const handleClosePerformance = useCallback(() => {
    setShowPerformance(false);
    setHasUnsavedChanges(false);
  }, []);

  // Show loading state while handoff data is loading
  if (handoffLoading) {
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

        {/* Loading state */}
        <div className="flex items-center justify-center py-20" role="status" aria-label="Loading station details">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading station details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBackClick} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Production Floor
        </Button>
        <Badge variant="secondary" className="gap-1.5">
          <Monitor className="w-3 h-3" />
          Station Detail — {stationName}
        </Badge>
        {hasUnsavedChanges && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/50">
            Unsaved changes
          </Badge>
        )}
      </div>

      {/* Station panel */}
      <OperatorStationPanel
        stationId={stationId}
        stationName={stationName}
        onCreateHandoff={handleOpenHandoff}
        onPerformanceUpdate={handleOpenPerformance}
        onViewWorkOrder={handleViewWorkOrder}
      />

      {showHandoff && (
        <NewHandoffForm
          onClose={handleCloseHandoff}
          onSubmit={async (data) => {
            await createHandoffRecord(data);
            setHasUnsavedChanges(false);
          }}
          initialStationId={stationId}
        />
      )}

      {showPerformance && <JobPerformanceUpdateForm onClose={handleClosePerformance} />}

      {/* Leave confirmation dialog */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this page?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>Leave anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
