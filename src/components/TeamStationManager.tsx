import { useState } from "react";
import { useStations, Station } from "@/hooks/useStations";
import { useTeams } from "@/hooks/useTeams";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkCenterType, ALL_WORK_CENTER_TYPES } from "@/types/handoff";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { cn } from "@/lib/utils";
import { BulkUploadDialog } from "./BulkUploadDialog";

interface TeamStationManagerProps {
  teamId: string;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  onStationChange?: () => void;
}

export function TeamStationManager({ teamId, teamName, open, onOpenChange, onComplete, onStationChange }: TeamStationManagerProps) {
  const { stations, loading, createStation, refreshStations } = useStations(teamId);
  const { teams } = useTeams();
  const { organization } = useUserOrganization();
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
    }
  };

  const handleDeleteStation = async (station: Station) => {
    const { error } = await supabase.from("stations").delete().eq("id", station.id);

    if (error) {
      toast({ title: "Failed to delete station", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Station deleted", description: `${station.name} has been removed.` });
      refreshStations();
    }
  };

  const handleReassignStation = async () => {
    if (!reassigningStation || !reassignTeamId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("stations")
      .update({ team_id: reassignTeamId })
      .eq("id", reassigningStation.id);
    setIsSaving(false);

    if (error) {
      toast({ title: "Failed to reassign", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Station reassigned", description: `${reassigningStation.name} moved to new team.` });
      setReassigningStation(null);
      refreshStations();
    }
  };

  // Filter out current team for reassignment options
  const otherTeams = teams.filter((t) => t.id !== teamId);

  // Group stations by work center type
  const groupedStations = stations.reduce(
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
                      <Select value={workCenterType} onValueChange={(v) => setWorkCenterType(v as WorkCenterType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_WORK_CENTER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  {stations.length} station{stations.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : stations.length === 0 ? (
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
        <DialogContent>
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
              <Select value={editWorkCenterType} onValueChange={(v) => setEditWorkCenterType(v as WorkCenterType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_WORK_CENTER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        <DialogContent>
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
