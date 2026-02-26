import { useState } from "react";
import { useStations, Station } from "@/hooks/useStations";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Loader2, 
  Wrench, 
  Factory,
  FileSpreadsheet,
  ChevronRight,
  CheckCircle2
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
}

export function TeamStationManager({ 
  teamId, 
  teamName, 
  open, 
  onOpenChange,
  onComplete 
}: TeamStationManagerProps) {
  const { stations, loading, createStation, refreshStations } = useStations(teamId);
  const { organization } = useUserOrganization();
  const { toast } = useToast();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("");
  const [workCenter, setWorkCenter] = useState("");
  const [workCenterType, setWorkCenterType] = useState<WorkCenterType>("CNC Mill");
  const [isCreating, setIsCreating] = useState(false);

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

  // Group stations by work center type
  const groupedStations = stations.reduce((acc, station) => {
    const type = station.work_center_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(station);
    return acc;
  }, {} as Record<WorkCenterType, Station[]>);

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
                      <Select 
                        value={workCenterType} 
                        onValueChange={(v) => setWorkCenterType(v as WorkCenterType)}
                      >
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
                <h3 className="text-sm font-medium">
                  Stations in {teamName}
                </h3>
                <Badge variant="secondary">
                  {stations.length} station{stations.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                    const Icon = workCenterIcons[type as WorkCenterType];
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
                            <div
                              key={station.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{station.station_id}</p>
                                <p className="text-xs text-muted-foreground truncate">{station.name}</p>
                              </div>
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
