import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { StationCard } from "@/components/StationCard";
import { HandoffCard } from "@/components/HandoffCard";
import { HandoffDetailModal } from "@/components/HandoffDetailModal";
import { ShiftStats } from "@/components/ShiftStats";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { JobPerformanceUpdateForm } from "@/components/JobPerformanceUpdateForm";
import { WorkCenterFilter } from "@/components/WorkCenterFilter";
import { OperatorWorkflowPanel } from "@/components/OperatorWorkflowPanel";
import { CreateWorkOrderDialog } from "@/components/queue/CreateWorkOrderDialog";
import { PlanningAssistantModal } from "@/components/queue/PlanningAssistantModal";
import { SupervisorDashboard } from "@/components/dashboard/SupervisorDashboard";
import { OperatorDashboard } from "@/components/dashboard/OperatorDashboard";
import { StationDetailView } from "@/components/dashboard/StationDetailView";
import { ExpiredTrialGate } from "@/components/ExpiredTrialGate";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, useHandoffRecords, type Station, type HandoffRecord } from "@/hooks/useStations";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrgContext } from "@/contexts/OrgContext";

import { mockStations, mockHandoffRecords } from "@/lib/mockData";
import { type WorkCenterType, type StationInfo, type ShiftHandoffRecord } from "@/types/handoff";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  LayoutGrid,
  History,
  Building2,
  Lightbulb,
  ListTodo,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TourTriggerButton } from "@/components/onboarding";

// ── Memoized transform functions (Phase 6 optimization) ──

const toStationInfoCache = new WeakMap<Station, StationInfo>();

function toStationInfo(station: Station): StationInfo {
  const cached = toStationInfoCache.get(station);
  if (cached) return cached;

  const status = station.current_status;
  const result: StationInfo = {
    stationId: station.station_id,
    name: station.name,
    workCenter: station.work_center,
    workCenterType: station.work_center_type,
    isActive: station.is_active,
    currentJob: status?.current_job_work_order
      ? {
          workOrder: status.current_job_work_order,
          partNumber: status.current_job_part_number || "",
          state: status.current_job_state as StationInfo["currentJob"]["state"],
          operator: status.current_operator_name || "",
          partsComplete: status.parts_complete || 0,
          partsRequired: status.parts_required || 0,
        }
      : undefined,
    condition: {
      status: (status?.condition_status as "OK" | "Issue") ?? "OK",
      notes: status?.condition_notes || undefined,
    },
  };
  toStationInfoCache.set(station, result);
  return result;
}

// Convert database record to ShiftHandoffRecord for display
function toHandoffRecord(record: HandoffRecord): ShiftHandoffRecord {
  return {
    recordId: record.id,
    recordVersion: record.record_version,
    date: record.date,
    shift: record.shift,
    workOrder: record.work_order,
    workCenter: record.work_center,
    workCenterType: record.work_center_type,
    machineId: record.machine_id,
    part: {
      partNumber: record.part_number,
      revision: record.part_revision,
      operationNumber: record.operation_number,
    },
    personnel: {
      outgoingOperator: record.outgoing_operator_name,
      incomingOperator: record.incoming_operator_name,
      supervisor: record.supervisor_name || undefined,
    },
    jobState: {
      primaryState: record.primary_state,
      reason: record.state_reason || undefined,
      delayCode: (record.delay_code as ShiftHandoffRecord["jobState"]["delayCode"]) ?? "None",
    },
    machineReadiness: record.machine_readiness as ShiftHandoffRecord["machineReadiness"],
    equipmentReadiness: record.equipment_readiness as ShiftHandoffRecord["equipmentReadiness"],
    machineCondition: record.machine_condition as ShiftHandoffRecord["machineCondition"],
    weldingCondition: record.welding_condition as ShiftHandoffRecord["weldingCondition"],
    waterJetCondition: record.water_jet_condition as ShiftHandoffRecord["waterJetCondition"],
    qualityStatus: {
      lastGoodPartTimestamp: record.last_good_part_timestamp || "",
      partsCompletedThisShift: record.parts_completed_this_shift,
      scrapCount: record.scrap_count,
      reworkCount: record.rework_count,
      criticalDimsVerified: record.critical_dims_verified,
      qaNotified: record.qa_notified as ShiftHandoffRecord["qualityStatus"]["qaNotified"],
      qualityNotes: record.quality_notes || undefined,
    },
    setupProcess: {
      fixtureInstalled: record.fixture_installed as ShiftHandoffRecord["setupProcess"]["fixtureInstalled"],
      clampsBoltsTorqued: record.clamps_bolts_torqued as ShiftHandoffRecord["setupProcess"]["clampsBoltsTorqued"],
      fixtureOrientationVerified:
        record.fixture_orientation_verified as ShiftHandoffRecord["setupProcess"]["fixtureOrientationVerified"],
      specialInstructionsFollowed:
        record.special_instructions_followed as ShiftHandoffRecord["setupProcess"]["specialInstructionsFollowed"],
      processNotesForNextShift: record.process_notes_for_next_shift || undefined,
    },
    materialsStatus: {
      rawMaterialAvailable: record.raw_material_available,
      nextMaterialLotReady: record.next_material_lot_ready,
      materialIssuesNoted: record.material_issues_noted,
      materialNotes: record.material_notes || undefined,
    },
    handoffSummary: record.handoff_summary,
    signOff: {
      outgoingOperatorName: record.outgoing_operator_name,
      incomingOperatorName: record.incoming_operator_name,
      supervisorName: record.supervisor_name || undefined,
      outgoingTime: record.outgoing_time || "",
      incomingTime: record.incoming_time || "",
      supervisorTime: record.supervisor_time || undefined,
    },
    toolingNotes: record.tooling_notes || [],
    issuesFollowUps: record.issues_follow_ups || [],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

const Index = () => {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useOrgContext();
  const { stations: dbStations, loading: stationsLoading } = useStations(currentTeam?.id, organization?.id);
  const {
    records: dbRecords,
    loading: recordsLoading,
    createHandoffRecord,
  } = useHandoffRecords(currentTeam?.id, organization?.id);
  const {
    isComplete,
    isLoading: onboardingLoading,
    isStepCompleted,
    hasSeenWelcome,
    setupWizardDismissed,
  } = useOnboardingContext();
  const { hasOrgSupervisorAccess, loading: roleLoading } = useAdminAccess();

  // Supervisors, org admins, and platform admins get the production overview dashboard
  const showSupervisorView = !!user && hasOrgSupervisorAccess;

  const [showNewHandoff, setShowNewHandoff] = useState(false);
  const [showPerformanceUpdate, setShowPerformanceUpdate] = useState(false);
  const [showCreateWorkOrder, setShowCreateWorkOrder] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<WorkCenterType[]>([]);
  const [selectedStationForAction, setSelectedStationForAction] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"supervisor" | "operator" | "station-detail">("supervisor");
  const [selectedHandoff, setSelectedHandoff] = useState<ShiftHandoffRecord | null>(null);
  const [focusedStation, setFocusedStation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [handoffPrefill, setHandoffPrefill] = useState<{
    work_order?: string;
    part_number?: string;
    operation_number?: string;
    station_id?: string;
  } | null>(null);

  // Auto-open handoff form when navigated from queue item detail
  useEffect(() => {
    const autoOpen = sessionStorage.getItem("auto_open_handoff");
    if (autoOpen === "true") {
      sessionStorage.removeItem("auto_open_handoff");
      const prefillRaw = sessionStorage.getItem("handoff_prefill");
      if (prefillRaw) {
        try {
          const prefill = JSON.parse(prefillRaw) as {
            work_order?: string;
            part_number?: string;
            operation_number?: string;
            station_id?: string;
          };
          setHandoffPrefill(prefill);
          if (prefill.station_id) {
            setSelectedStationForAction(prefill.station_id);
          }
        } catch (e) {
          console.error("Failed to parse handoff prefill:", e);
        } finally {
          sessionStorage.removeItem("handoff_prefill");
        }
      }
      setShowNewHandoff(true);
    }
  }, []);

  // Redirect to setup if onboarding is incomplete and user is authenticated
  useEffect(() => {
    if (user && !authLoading && !onboardingLoading) {
      const hasCompletedSetup = isStepCompleted("shop-setup") || isStepCompleted("organization-setup") || isComplete;

      if (!setupWizardDismissed && !hasSeenWelcome && !hasCompletedSetup) {
        navigate("/setup", { replace: true });
      }
    }
  }, [
    user,
    authLoading,
    onboardingLoading,
    hasSeenWelcome,
    isComplete,
    isStepCompleted,
    navigate,
    setupWizardDismissed,
  ]);

  // Create a map of stationId to database id for linking
  const stationIdToDbId = useMemo(() => {
    const map: Record<string, string> = {};
    dbStations.forEach((s) => {
      map[s.station_id] = s.id;
    });
    return map;
  }, [dbStations]);

  // Use database data when logged in, mock data when not
  const stations: StationInfo[] = useMemo(() => {
    if (!user) return mockStations;
    return dbStations.map(toStationInfo);
  }, [user, dbStations]);

  const handoffRecords: ShiftHandoffRecord[] = useMemo(() => {
    if (!user) return mockHandoffRecords;
    return dbRecords.map(toHandoffRecord);
  }, [user, dbRecords]);

  const filteredStations = useMemo(() => {
    if (selectedTypes.length === 0) return stations;
    return stations.filter((s) => selectedTypes.includes(s.workCenterType));
  }, [selectedTypes, stations]);

  const filteredHandoffs = useMemo(() => {
    if (selectedTypes.length === 0) return handoffRecords;
    return handoffRecords.filter((r) => selectedTypes.includes(r.workCenterType));
  }, [selectedTypes, handoffRecords]);

  const isLoading = stationsLoading || recordsLoading;
  const hasData = stations.length > 0 || handoffRecords.length > 0;
  const isRoleResolving = authLoading || roleLoading || onboardingLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Trial gate for authenticated users */}
        {user ? (
          <ExpiredTrialGate>
            {/* Show skeleton while roles/org data are still loading */}
            {isRoleResolving ? (
              <div className="py-12 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : showSupervisorView ? (
              viewMode === "operator" ? (
                <OperatorDashboard isAdminView onBackToOverview={() => setViewMode("supervisor")} />
              ) : viewMode === "station-detail" && focusedStation ? (
                <StationDetailView
                  stationId={focusedStation.id}
                  stationName={focusedStation.name}
                  onBack={() => {
                    setViewMode("supervisor");
                    setFocusedStation(null);
                  }}
                />
              ) : (
                <SupervisorDashboard
                  onNewHandoff={() => setShowNewHandoff(true)}
                  onPerformanceUpdate={() => setShowPerformanceUpdate(true)}
                  onCreateWorkOrder={() => setShowCreateWorkOrder(true)}
                  onSwitchToOperatorView={() => setViewMode("operator")}
                  onViewStation={(id, name) => {
                    setFocusedStation({ id, name });
                    setViewMode("station-detail");
                  }}
                  onViewHandoff={(handoffId) => {
                    const found = handoffRecords.find((h) => h.recordId === handoffId);
                    if (found) setSelectedHandoff(found);
                  }}
                />
              )
            ) : (
              <OperatorDashboard />
            )}
          </ExpiredTrialGate>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="mb-6" data-tour="shift-stats">
              <ShiftStats />
            </div>

            {/* Login prompt for unauthenticated users */}
            {!authLoading && !user && (
              <Card className="mb-6 border-primary/30 bg-primary/5">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Sign in to track your handoffs</p>
                      <p className="text-sm text-muted-foreground">
                        Create teams, add operators, and share data in real-time
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/auth")}>Sign In</Button>
                </CardContent>
              </Card>
            )}

            {/* Main Content */}
            <Tabs defaultValue="stations" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-secondary">
                  <TabsTrigger value="stations" className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Stations
                  </TabsTrigger>
                  <TabsTrigger value="handoffs" className="gap-2">
                    <History className="w-4 h-4" />
                    Handoffs
                  </TabsTrigger>
                </TabsList>

                {user && (
                  <div className="flex gap-2 flex-wrap">
                    <TourTriggerButton />
                    <Button
                      onClick={() => setShowCreateWorkOrder(true)}
                      className="gap-2 bg-primary"
                      data-tour="add-work-order"
                    >
                      <Package className="w-4 h-4" />
                      Add Work Order
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/queue")} className="gap-2">
                      <ListTodo className="w-4 h-4" />
                      Queue
                    </Button>
                    <Button variant="outline" onClick={() => setShowPerformanceUpdate(true)} className="gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Performance Update
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewHandoff(true)}
                      className="gap-2"
                      data-tour="new-handoff"
                    >
                      <Plus className="w-4 h-4" />
                      New Handoff
                    </Button>
                  </div>
                )}
              </div>

              {/* Filter */}
              <div data-tour="work-center-filter">
                <WorkCenterFilter selectedTypes={selectedTypes} onFilterChange={setSelectedTypes} />
              </div>

              <TabsContent value="stations" className="mt-0" data-tour="station-grid">
                {isLoading && !hasData && user ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6">
                    {/* Operator Workflow Panel - Left Sidebar */}
                    {user && (
                      <div className="hidden lg:block w-80 flex-shrink-0">
                        <div className="sticky top-4">
                          <OperatorWorkflowPanel />
                        </div>
                      </div>
                    )}

                    {/* Station Grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredStations.map((station) => {
                          const dbId = stationIdToDbId[station.stationId];
                          return (
                            <StationCard
                              key={station.stationId}
                              station={station}
                              stationDbId={dbId}
                              onNewHandoff={() => {
                                setSelectedStationForAction(dbId);
                                setShowNewHandoff(true);
                              }}
                              onPerformanceUpdate={() => {
                                setSelectedStationForAction(dbId);
                                setShowPerformanceUpdate(true);
                              }}
                              onViewQueue={() => {
                                if (dbId) {
                                  navigate(`/queue?station=${dbId}`);
                                } else {
                                  navigate("/queue");
                                }
                              }}
                              onAddWorkOrder={() => {
                                setSelectedStationForAction(dbId);
                                setShowCreateWorkOrder(true);
                              }}
                            />
                          );
                        })}
                      </div>
                      {filteredStations.length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            {user ? (
                              <>
                                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg mb-2">No stations configured</h3>
                                <p className="text-muted-foreground mb-4 max-w-md">
                                  Create a team and add work stations to start tracking handoffs and managing your shop
                                  floor.
                                </p>
                                <div className="flex gap-2">
                                  <Button variant="outline" onClick={() => navigate("/teams")}>
                                    <Users className="w-4 h-4 mr-2" />
                                    Manage Teams
                                  </Button>
                                  <Button onClick={() => navigate("/setup")}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Complete Setup
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-muted-foreground">No stations match the selected filters.</p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="handoffs" className="mt-0">
                {isLoading && !hasData && user ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Recent Handoff Records
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredHandoffs.map((record) => (
                        <HandoffCard key={record.recordId} record={record} onClick={() => setSelectedHandoff(record)} />
                      ))}
                    </div>
                    {filteredHandoffs.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          {user ? (
                            <>
                              <History className="w-12 h-12 text-muted-foreground mb-4" />
                              <h3 className="font-semibold text-lg mb-2">No handoff records yet</h3>
                              <p className="text-muted-foreground mb-4 max-w-md">
                                {stations.length > 0
                                  ? "Create your first handoff record to start documenting shift transitions."
                                  : "Set up your work stations first, then you can create handoff records."}
                              </p>
                              {stations.length > 0 ? (
                                <Button onClick={() => setShowNewHandoff(true)}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create First Handoff
                                </Button>
                              ) : (
                                <Button onClick={() => navigate("/teams")}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Set Up Stations
                                </Button>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground">No handoff records match the selected filters.</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* New Handoff Modal */}
      {showNewHandoff && (
        <NewHandoffForm
          onClose={() => {
            setShowNewHandoff(false);
            setHandoffPrefill(null);
          }}
          onSubmit={createHandoffRecord}
          initialStationId={selectedStationForAction}
          prefillData={handoffPrefill || undefined}
        />
      )}

      {/* Performance Update Modal */}
      {showPerformanceUpdate && <JobPerformanceUpdateForm onClose={() => setShowPerformanceUpdate(false)} />}

      {/* Create Work Order Dialog */}
      <CreateWorkOrderDialog
        open={showCreateWorkOrder}
        onOpenChange={setShowCreateWorkOrder}
        preSelectedStationId={selectedStationForAction}
      />

      {/* Handoff Detail Modal */}
      <HandoffDetailModal
        open={!!selectedHandoff}
        onOpenChange={(open) => !open && setSelectedHandoff(null)}
        record={selectedHandoff}
        onViewWorkOrder={(workOrder) => {
          setSelectedHandoff(null);
          navigate(`/queue?wo=${encodeURIComponent(workOrder)}`);
        }}
      />

      {/* AI Planning Assistant - supervisors/admins only */}
      {hasOrgSupervisorAccess && organization && <PlanningAssistantModal organizationId={organization.id} />}
    </div>
  );
};

export default Index;
