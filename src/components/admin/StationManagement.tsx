import { useState } from "react";
import { StationWithTeam, useAllStations, useAllTeams } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Loader2, MoreHorizontal, Plus, Search, Wrench, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WORK_CENTER_TYPES = ["CNC Mill", "CNC Lathe", "Welding", "Water Jet", "Assembly", "Inspection", "Other"];

interface StationManagementProps {
  isAdmin: boolean;
}

export function StationManagement({ isAdmin }: StationManagementProps) {
  const { stations, loading, createStation, updateStation, deleteStation } = useAllStations();
  const { teams } = useAllTeams();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStation, setEditingStation] = useState<StationWithTeam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    station_id: "",
    name: "",
    work_center: "",
    work_center_type: "",
    team_id: "",
  });

  const resetForm = () => {
    setFormData({
      station_id: "",
      name: "",
      work_center: "",
      work_center_type: "",
      team_id: "",
    });
    setEditingStation(null);
  };

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.work_center.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.station_id || !formData.name || !formData.work_center || !formData.work_center_type) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await createStation({
      station_id: formData.station_id,
      name: formData.name,
      work_center: formData.work_center,
      work_center_type: formData.work_center_type,
      team_id: formData.team_id || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Failed to create station",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Station created", description: `${formData.name} has been created.` });
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingStation) return;

    setIsSubmitting(true);
    const { error } = await updateStation(editingStation.id, {
      name: formData.name,
      work_center: formData.work_center,
      work_center_type: formData.work_center_type,
      team_id: formData.team_id || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Failed to update station",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Station updated", description: `${formData.name} has been updated.` });
      setEditingStation(null);
      resetForm();
    }
  };

  const handleDelete = async (station: StationWithTeam) => {
    const { error } = await deleteStation(station.id);
    if (error) {
      toast({
        title: "Failed to delete station",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Station deleted", description: `${station.name} has been removed.` });
    }
  };

  const handleToggleActive = async (station: StationWithTeam) => {
    const { error } = await updateStation(station.id, { is_active: !station.is_active });
    if (error) {
      toast({
        title: "Failed to update station",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (station: StationWithTeam) => {
    setEditingStation(station);
    setFormData({
      station_id: station.station_id,
      name: station.name,
      work_center: station.work_center,
      work_center_type: station.work_center_type,
      team_id: station.team_id || "",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const StationFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="station_id">Station ID *</Label>
          <Input
            id="station_id"
            placeholder="e.g., CNC-001"
            value={formData.station_id}
            onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
            disabled={!!editingStation}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Haas VF-2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="work_center">Work Center *</Label>
          <Input
            id="work_center"
            placeholder="e.g., CNC Mill Bay 1"
            value={formData.work_center}
            onChange={(e) => setFormData({ ...formData, work_center: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work_center_type">Type *</Label>
          <Select
            value={formData.work_center_type}
            onValueChange={(v) => setFormData({ ...formData, work_center_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {WORK_CENTER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team">Assign to Team</Label>
        <Select
          value={formData.team_id}
          onValueChange={(v) => setFormData({ ...formData, team_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="No team (global)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No team (global)</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Station Management</CardTitle>
            <CardDescription>
              {stations.length} station(s) • {stations.filter((s) => s.is_active).length} active
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Station
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Station</DialogTitle>
                    <DialogDescription>
                      Create a new work station for handoff tracking.
                    </DialogDescription>
                  </DialogHeader>
                  <StationFormFields />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Station"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead>Work Center</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStations.map((station) => (
              <TableRow key={station.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs text-muted-foreground">{station.station_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{station.work_center}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{station.work_center_type}</Badge>
                </TableCell>
                <TableCell>
                  {station.team_name ? (
                    <Badge variant="outline">{station.team_name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Global</span>
                  )}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Switch
                      checked={station.is_active}
                      onCheckedChange={() => handleToggleActive(station)}
                    />
                  ) : (
                    <Badge variant={station.is_active ? "default" : "secondary"}>
                      {station.is_active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(station)} className="gap-2">
                          <Pencil className="w-4 h-4" />
                          Edit Station
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(station)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Station
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingStation} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>
              Update station details for {editingStation?.name}.
            </DialogDescription>
          </DialogHeader>
          <StationFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
