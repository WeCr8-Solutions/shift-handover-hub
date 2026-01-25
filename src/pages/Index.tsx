import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StationCard } from "@/components/StationCard";
import { HandoffCard } from "@/components/HandoffCard";
import { ShiftStats } from "@/components/ShiftStats";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { WorkCenterFilter } from "@/components/WorkCenterFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, useHandoffRecords, Station, HandoffRecord } from "@/hooks/useStations";
import { mockStations, mockHandoffRecords } from "@/lib/mockData";
import { WorkCenterType, StationInfo, ShiftHandoffRecord } from "@/types/handoff";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, History, Loader2, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Convert database station to StationInfo for display
function toStationInfo(station: Station): StationInfo {
  const status = station.current_status;
  return {
    stationId: station.station_id,
    name: station.name,
    workCenter: station.work_center,
    workCenterType: station.work_center_type,
    isActive: station.is_active,
    currentJob: status?.current_job_work_order ? {
      workOrder: status.current_job_work_order,
      partNumber: status.current_job_part_number || "",
      state: status.current_job_state as any,
      operator: status.current_operator_name || "",
      partsComplete: status.parts_complete || 0,
      partsRequired: status.parts_required || 0,
    } : undefined,
    condition: { status: (status?.condition_status as "OK" | "Issue") || "OK", notes: status?.condition_notes || undefined },
  };
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
      delayCode: (record.delay_code as any) || "None",
    },
    machineReadiness: record.machine_readiness as any,
    equipmentReadiness: record.equipment_readiness as any,
    machineCondition: record.machine_condition as any,
    weldingCondition: record.welding_condition as any,
    waterJetCondition: record.water_jet_condition as any,
    qualityStatus: {
      lastGoodPartTimestamp: record.last_good_part_timestamp || "",
      partsCompletedThisShift: record.parts_completed_this_shift,
      scrapCount: record.scrap_count,
      reworkCount: record.rework_count,
      criticalDimsVerified: record.critical_dims_verified,
      qaNotified: record.qa_notified as any,
      qualityNotes: record.quality_notes || undefined,
    },
    setupProcess: {
      fixtureInstalled: record.fixture_installed as any,
      clampsBoltsTorqued: record.clamps_bolts_torqued as any,
      fixtureOrientationVerified: record.fixture_orientation_verified as any,
      specialInstructionsFollowed: record.special_instructions_followed as any,
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
  const { stations: dbStations, loading: stationsLoading } = useStations(currentTeam?.id);
  const { records: dbRecords, loading: recordsLoading, createHandoffRecord } = useHandoffRecords(currentTeam?.id);
  
  const [showNewHandoff, setShowNewHandoff] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<WorkCenterType[]>([]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Stats Overview */}
        <div className="mb-6">
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
                  <p className="text-sm text-muted-foreground">Create teams, add operators, and share data in real-time</p>
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
              <Button onClick={() => setShowNewHandoff(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Handoff
              </Button>
            )}
          </div>

          {/* Filter */}
          <WorkCenterFilter 
            selectedTypes={selectedTypes} 
            onFilterChange={setSelectedTypes} 
          />

          <TabsContent value="stations" className="mt-0">
            {isLoading && user ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStations.map((station) => (
                    <StationCard key={station.stationId} station={station} />
                  ))}
                </div>
                {filteredStations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {user ? "No stations in this workspace. Create a team and add stations to get started." : "No stations match the selected filters."}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="handoffs" className="mt-0">
            {isLoading && user ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                    <HandoffCard key={record.recordId} record={record} />
                  ))}
                </div>
                {filteredHandoffs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {user ? "No handoff records yet. Create your first handoff to get started." : "No handoff records match the selected filters."}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* New Handoff Modal */}
      {showNewHandoff && (
        <NewHandoffForm 
          onClose={() => setShowNewHandoff(false)} 
          onSubmit={createHandoffRecord}
        />
      )}
    </div>
  );
};

export default Index;
