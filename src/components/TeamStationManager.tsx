import { useEffect, useState } from "react";
import { useStations, Station } from "@/hooks/useStations";
import { useTeams } from "@/hooks/useTeams";
import { useOrgContext } from "@/contexts/OrgContext";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { supabase } from "@/integrations/supabase/client";
import { useStationMachineAssignment } from "@/hooks/useStationMachineProfile";
import { useDNCConnector } from "@/hooks/useDNCConnector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Loader2,
  Wrench,
  Factory,
  FileSpreadsheet,
  ChevronRight,
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Cpu,
  Wifi,
  WifiOff,
  Radio,
} from "lucide-react";
import { StationMachineContextDialog } from "@/components/station/StationMachineContextDialog";
import { useToast } from "@/hooks/use-toast";
import { WorkCenterType, ALL_WORK_CENTER_TYPES } from "@/types/handoff";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { cn } from "@/lib/utils";
import { BulkUploadDialog } from "./BulkUploadDialog";
import { Separator } from "@/components/ui/separator";

/** Inline machine profile + DNC info for the edit station dialog */
function EditStationMachineInfo({
  stationId,
  stationName,
  organizationId,
}: {
  stationId: string;
  stationName: string;
  organizationId: string | null;
}) {
  const { assignment, loading: assignLoading } = useStationMachineAssignment(stationId, organizationId);
  const { getStationDNCConfig } = useDNCConnector(stationId);
  const [manualProfile, setManualProfile] = useState<Record<string, any> | null>(null);
  const [loadingManual, setLoadingManual] = useState(true);
  const [dncConfig, setDncConfig] = useState<Record<string, any> | null>(null);
  const [loadingDnc, setLoadingDnc] = useState(true);
  const [showMachineCtx, setShowMachineCtx] = useState(false);

  useEffect(() => {
    const fetchManual = async () => {
      setLoadingManual(true);
      const { data } = await supabase
        .from("station_manual_machine_profiles" as any)
        .select("*")
        .eq("station_id", stationId)
        .maybeSingle();
      setManualProfile(data as any);
      setLoadingManual(false);
    };
    const fetchDnc = async () => {
      setLoadingDnc(true);
      const cfg = await getStationDNCConfig(stationId);
      setDncConfig(cfg);
      setLoadingDnc(false);
    };
    fetchManual();
    fetchDnc();
  }, [stationId, getStationDNCConfig]);

  const isLoading = assignLoading || loadingManual;
  const hasLibrary = Boolean(assignment?.machine);
  const hasManual = Boolean(manualProfile) && !hasLibrary;

  const renderCapabilities = (profile: Record<string, any>) => {
    const caps: string[] = [];
    if (profile.five_axis_simultaneous) caps.push("5-Axis");
    if (profile.fourth_axis) caps.push("4th Axis");
    if (profile.live_tooling) caps.push("Live Tooling");
    if (profile.y_axis_turn) caps.push("Y-Axis");
    if (profile.sub_spindle) caps.push("Sub Spindle");
    if (profile.probing) caps.push("Probing");
    if (profile.through_spindle_coolant) caps.push("TSC");
    if (profile.pallet_pool) caps.push("Pallet");
    if (profile.bar_feeder) caps.push("Bar Feeder");
    return caps;
  };

  /** Render instance-level details (serial, asset tag, control, spindle) */
  const renderInstanceDetails = (profile: Record<string, any>) => {
    const details: { label: string; value: string }[] = [];
    if (profile.serial_number) details.push({ label: "S/N", value: profile.serial_number });
    if (profile.asset_tag) details.push({ label: "Asset", value: profile.asset_tag });
    if (profile.control_type) details.push({ label: "Control", value: `${profile.control_type}${profile.control_model ? ` ${profile.control_model}` : ''}` });
    if (profile.max_spindle_rpm) details.push({ label: "Spindle", value: `${profile.max_spindle_rpm} RPM` });
    if (profile.spindle_taper) details.push({ label: "Taper", value: profile.spindle_taper });
    if (profile.spindle_power_hp) details.push({ label: "Power", value: `${profile.spindle_power_hp} HP` });
    if (profile.tool_magazine_capacity) details.push({ label: "Tools", value: `${profile.tool_magazine_capacity} pockets` });
    if (profile.year_installed) details.push({ label: "Installed", value: String(profile.year_installed) });
    return details;
  };

  const getCategoryLabel = (cat: string | undefined) => {
    const labels: Record<string, string> = {
      cnc_machine: "CNC Machine", assembly: "Assembly", inspection: "Inspection",
      workstation: "Workstation", desk: "Desk", welding: "Welding",
      paint_finish: "Paint/Finish", shipping_receiving: "Shipping/Receiving",
      tool_crib: "Tool Crib", deburr: "Deburr", wash: "Wash", other: "Other",
    };
    return labels[cat || ""] || cat || "Machine";
  };

  return (
    <>
      <Separator />
      {/* Machine Profile */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Cpu className="w-3.5 h-3.5" />
          Machine Profile
        </span>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading machine info…</span>
          </div>
        ) : hasLibrary && assignment?.machine ? (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-3 pb-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {assignment.machine.manufacturer} {assignment.machine.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.machine.machine_type} · {assignment.machine.platform_category}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">Verified</Badge>
              </div>
              {(assignment.machine.max_x_travel || assignment.machine.max_y_travel || assignment.machine.max_z_travel) && (
                <p className="text-[10px] text-muted-foreground pl-6">
                  Travel: {assignment.machine.max_x_travel ?? '–'}×{assignment.machine.max_y_travel ?? '–'}×{assignment.machine.max_z_travel ?? '–'} mm
                </p>
              )}
              {assignment.machine.max_part_weight && (
                <p className="text-[10px] text-muted-foreground pl-6">
                  Max part weight: {assignment.machine.max_part_weight} kg
                </p>
              )}
              {/* New: spindle/control/tool details from verified library */}
              {(() => {
                const details = renderInstanceDetails(assignment.machine);
                return details.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-6">
                    {details.map(d => (
                      <p key={d.label} className="text-[10px] text-muted-foreground">
                        <span className="font-medium">{d.label}:</span> {d.value}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}
              {(() => {
                const caps = renderCapabilities(assignment.machine);
                return caps.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {caps.map(c => <Badge key={c} variant="outline" className="text-[9px] px-1.5 py-0">{c}</Badge>)}
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        ) : hasManual && manualProfile ? (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-3 pb-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {manualProfile.manufacturer !== "N/A" ? `${manualProfile.manufacturer} ` : ""}{manualProfile.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCategoryLabel(manualProfile.station_category)}
                    {manualProfile.machine_type && manualProfile.station_category === "cnc_machine" ? ` · ${manualProfile.machine_type}` : ""}
                    {manualProfile.platform_category && manualProfile.platform_category !== "N/A" ? ` · ${manualProfile.platform_category}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">Manual</Badge>
              </div>
              {/* Instance details: serial, asset tag, control, spindle */}
              {(() => {
                const details = renderInstanceDetails(manualProfile);
                return details.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-6">
                    {details.map(d => (
                      <p key={d.label} className="text-[10px] text-muted-foreground">
                        <span className="font-medium">{d.label}:</span> {d.value}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}
              {(manualProfile.max_x_travel || manualProfile.max_y_travel || manualProfile.max_z_travel) && (
                <p className="text-[10px] text-muted-foreground pl-6">
                  Travel: {manualProfile.max_x_travel ?? '–'}×{manualProfile.max_y_travel ?? '–'}×{manualProfile.max_z_travel ?? '–'} mm
                </p>
              )}
              {manualProfile.max_part_weight && (
                <p className="text-[10px] text-muted-foreground pl-6">
                  Max part weight: {manualProfile.max_part_weight} kg
                </p>
              )}
              {manualProfile.typical_tolerance && (
                <p className="text-[10px] text-muted-foreground pl-6">
                  Typical tolerance: ±{manualProfile.typical_tolerance} mm
                </p>
              )}
              {(() => {
                const caps = renderCapabilities(manualProfile);
                return caps.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {caps.map(c => <Badge key={c} variant="outline" className="text-[9px] px-1.5 py-0">{c}</Badge>)}
                  </div>
                ) : null;
              })()}
              {manualProfile.material_capability?.length > 0 && (
                <div className="pl-6">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Materials:</p>
                  <div className="flex flex-wrap gap-1">
                    {manualProfile.material_capability.map((m: string) => (
                      <Badge key={m} variant="secondary" className="text-[9px] px-1.5 py-0">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {manualProfile.notes && (
                <p className="text-[10px] text-muted-foreground pl-6 italic">
                  {manualProfile.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            No machine profile attached to this station.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => setShowMachineCtx(true)}
        >
          <Cpu className="w-3.5 h-3.5" />
          {hasLibrary || hasManual ? "Manage Machine Profile" : "Attach Machine Profile"}
        </Button>
      </div>

      {/* DNC / G-Code Section */}
      <Separator />
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Radio className="w-3.5 h-3.5" />
          DNC &amp; G-Code
        </span>

        {loadingDnc ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Checking connection…</span>
          </div>
        ) : dncConfig ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {String(dncConfig.protocol || "DNC").toUpperCase()} Connected
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {dncConfig.host ? `${dncConfig.host}:${dncConfig.port}` : "Local connection configured"}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/50 text-primary shrink-0">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No DNC/G-Code connection configured.
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => setShowMachineCtx(true)}
        >
          <Radio className="w-3.5 h-3.5" />
          {dncConfig ? "Manage DNC Connection" : "Configure DNC / G-Code"}
        </Button>
      </div>

      <StationMachineContextDialog
        stationId={stationId}
        stationName={stationName}
        open={showMachineCtx}
        onOpenChange={setShowMachineCtx}
      />
    </>
  );
}

interface ReassignStationPayload {
  stationId: string;
  fromTeamId: string | null;
  toTeamId: string;
}

interface TeamStationManagerProps {
  teamId: string;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  onReassignOptimistic?: (payload: ReassignStationPayload) => void;
  onReassignRollback?: (payload: ReassignStationPayload) => void;
  onReassignCommitted?: () => void;
}

export function TeamStationManager({
  teamId,
  teamName,
  open,
  onOpenChange,
  onComplete,
  onReassignOptimistic,
  onReassignRollback,
  onReassignCommitted,
}: TeamStationManagerProps) {
  const { teams } = useTeams();
  const { organization } = useOrgContext();
  const { stations, loading, createStation, refreshStations } = useStations(teamId, organization?.id);
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("");
  const [workCenter, setWorkCenter] = useState("");
  const [workCenterType, setWorkCenterType] = useState<WorkCenterType>("CNC Mill");
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editName, setEditName] = useState("");
  const [editWorkCenter, setEditWorkCenter] = useState("");
  const [editWorkCenterType, setEditWorkCenterType] = useState<WorkCenterType>("CNC Mill");
  const [isSaving, setIsSaving] = useState(false);

  // Reassign state
  const [reassigningStation, setReassigningStation] = useState<Station | null>(null);
  const [reassignTeamId, setReassignTeamId] = useState("");
  const [optimisticallyMovedOutIds, setOptimisticallyMovedOutIds] = useState<Set<string>>(new Set());

  const handleAddStation = async () => {
    if (!stationId.trim() || !stationName.trim() || !workCenter.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const { error } = await createStation({
      station_id: stationId.trim(),
      name: stationName.trim(),
      work_center: workCenter.trim(),
      work_center_type: workCenterType,
      team_id: teamId,
      organization_id: organization?.id || null,
    });
    setIsCreating(false);

    if (error) {
      toast({
        title: "Failed to add station",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Station added!",
        description: `${stationName} has been added to ${teamName}.`,
      });
      // Reset form
      setStationId("");
      setStationName("");
      setWorkCenter("");
      setWorkCenterType("CNC Mill");
      setShowAddForm(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const handleEditStation = (station: Station) => {
    setEditingStation(station);
    setEditName(station.name);
    setEditWorkCenter(station.work_center);
    setEditWorkCenterType(station.work_center_type);
  };

  const handleSaveEdit = async () => {
    if (!editingStation) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("stations")
      .update({
        name: editName,
        work_center: editWorkCenter,
        work_center_type: editWorkCenterType,
      })
      .eq("id", editingStation.id);
    setIsSaving(false);

    if (error) {
      toast({ title: "Failed to update station", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Station updated", description: `${editName} has been updated.` });
      setEditingStation(null);
      refreshStations();
      onReassignCommitted?.();
    }
  };

  const handleDeleteStation = async (station: Station) => {
    const { error } = await supabase.from("stations").delete().eq("id", station.id);

    if (error) {
      toast({ title: "Failed to delete station", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Station deleted", description: `${station.name} has been removed.` });
      refreshStations();
      onReassignCommitted?.();
    }
  };

  const handleReassignStation = async () => {
    if (!reassigningStation || !reassignTeamId) return;

    const payload: ReassignStationPayload = {
      stationId: reassigningStation.id,
      fromTeamId: reassigningStation.team_id,
      toTeamId: reassignTeamId,
    };

    setOptimisticallyMovedOutIds((prev) => {
      const next = new Set(prev);
      next.add(payload.stationId);
      return next;
    });
    onReassignOptimistic?.(payload);

    setIsSaving(true);
    const { error } = await supabase
      .from("stations")
      .update({ team_id: payload.toTeamId })
      .eq("id", payload.stationId);
    setIsSaving(false);

    if (error) {
      setOptimisticallyMovedOutIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.stationId);
        return next;
      });
      onReassignRollback?.(payload);
      toast({ title: "Failed to reassign", description: getSafeErrorMessage(error), variant: "destructive" });
      return;
    }

    toast({ title: "Station reassigned", description: `${reassigningStation.name} moved to new team.` });
    setReassigningStation(null);
    setReassignTeamId("");
    await refreshStations();
    onReassignCommitted?.();
  };

  useEffect(() => {
    if (!open) {
      setOptimisticallyMovedOutIds(new Set());
    }
  }, [open]);

  // Filter out current team for reassignment options
  const otherTeams = teams.filter((t) => t.id !== teamId);
  const visibleStations = stations.filter((station) => !optimisticallyMovedOutIds.has(station.id));

  // Group stations by work center type
  const groupedStations = visibleStations.reduce(
    (acc, station) => {
      const type = station.work_center_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(station);
      return acc;
    },
    {} as Record<WorkCenterType, Station[]>,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-primary" />
              Add Stations to {teamName}
            </DialogTitle>
            <DialogDescription>
              Set up work stations for your team. You can add them one by one or use bulk upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Add Station</span>
                <span className="text-xs text-muted-foreground">Add one at a time</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setShowBulkUpload(true)}
              >
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Bulk Upload</span>
                <span className="text-xs text-muted-foreground">Import from Excel</span>
              </Button>
            </div>

            {/* Add Station Form */}
            {showAddForm && (
              <Card className="border-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    New Station
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-id">Station ID *</Label>
                      <Input
                        id="station-id"
                        placeholder="Enter station ID"
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-name">Display Name *</Label>
                      <Input
                        id="station-name"
                        placeholder="Enter display name"
                        value={stationName}
                        onChange={(e) => setStationName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="work-center">Department/Work Center *</Label>
                      <Input
                        id="work-center"
                        placeholder="Enter work center name"
                        value={workCenter}
                        onChange={(e) => setWorkCenter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work-center-type">Station Type *</Label>
                      <WorkCenterTypeCombobox
                        value={workCenterType}
                        onValueChange={(v) => setWorkCenterType(v as WorkCenterType)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStation} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Station
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Stations in {teamName}</h3>
                <Badge variant="secondary">
                  {visibleStations.length} station{visibleStations.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : visibleStations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Wrench className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No stations added yet. Add your first station above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedStations).map(([type, typeStations]) => {
                    const Icon = workCenterIcons[type as WorkCenterType] || Circle;
                    const colorClass = workCenterColors[type as WorkCenterType];
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Icon className={cn("w-4 h-4", colorClass)} />
                          {type}
                          <Badge variant="outline" className="ml-auto">
                            {typeStations.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {typeStations.map((station) => (
                            <div key={station.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{station.station_id}</p>
                                <p className="text-xs text-muted-foreground truncate">{station.name}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditStation(station)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {otherTeams.length > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setReassigningStation(station);
                                        setReassignTeamId("");
                                      }}
                                    >
                                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                                      Reassign Team
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteStation(station)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Add More Later
            </Button>
            <Button onClick={handleComplete} className="gap-2">
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog open={!!editingStation} onOpenChange={(open) => !open && setEditingStation(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>Update station details for {editingStation?.station_id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Department/Work Center</Label>
              <Input value={editWorkCenter} onChange={(e) => setEditWorkCenter(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Station Type</Label>
              <WorkCenterTypeCombobox
                value={editWorkCenterType}
                onValueChange={(v) => setEditWorkCenterType(v as WorkCenterType)}
              />
            </div>

            {/* Machine Profile Section */}
            {editingStation && (
              <EditStationMachineInfo
                stationId={editingStation.id}
                stationName={editingStation.name}
                organizationId={organization?.id ?? null}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStation(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Station Dialog */}
      <Dialog open={!!reassigningStation} onOpenChange={(open) => !open && setReassigningStation(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reassign Station</DialogTitle>
            <DialogDescription>
              Move {reassigningStation?.name} ({reassigningStation?.station_id}) to a different team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Team</Label>
              <Select value={reassignTeamId} onValueChange={setReassignTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {otherTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassigningStation(null)}>
              Cancel
            </Button>
            <Button onClick={handleReassignStation} disabled={isSaving || !reassignTeamId}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                "Reassign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onComplete={() => {
          refreshStations();
          setShowBulkUpload(false);
        }}
      />
    </>
  );
}
