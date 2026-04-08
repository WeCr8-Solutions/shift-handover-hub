import { useState, useMemo } from "react";
import { StationWithTeam, useAllStations, useAllTeams, useAllOrganizations } from "@/hooks/useAdminData";
import type { AdminComponentAccess } from "@/types/admin";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Loader2, MoreHorizontal, Plus, Search, Wrench, Trash2, Pencil, Building2, Users, FolderOpen, ChevronRight, Crown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkCenterTypeCombobox } from "@/components/ui/WorkCenterTypeCombobox";

interface StationManagementProps {
  isAdmin?: boolean;
  access?: AdminComponentAccess;
}

interface StationWithOrg extends StationWithTeam {
  organization_id?: string | null;
  organization_name?: string | null;
}

interface OrganizationBucket {
  id: string;
  name: string;
  teams: TeamBucket[];
  stationCount: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
}

interface TeamBucket {
  id: string | null;
  name: string;
  stations: StationWithOrg[];
}

type ViewMode = "grouped" | "flat";

export function StationManagement({ isAdmin, access }: StationManagementProps) {
  const isPlatformAdmin = access?.isPlatformAdmin ?? isAdmin ?? false;
  const { stations, loading, createStation, updateStation, deleteStation } = useAllStations({ organizationId: access?.organizationId ?? null });
  const { teams } = useAllTeams({ organizationId: access?.organizationId ?? null });
  const { organizations } = useAllOrganizations();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStation, setEditingStation] = useState<StationWithTeam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");

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

  // Enrich stations with org data via team -> org relationship
  const enrichedStations: StationWithOrg[] = useMemo(() => {
    return stations.map(station => {
      // Find the team's organization
      const team = teams.find(t => t.id === station.team_id);
      // Teams table doesn't have org_id directly, we need to infer from organizations
      // For now, try to match via organization stations
      const org = organizations.find(o => {
        // Check if any team in this org matches the station's team
        return teams.some(t => t.id === station.team_id);
      });
      
      return {
        ...station,
        organization_id: org?.id || null,
        organization_name: org?.name || null,
      };
    });
  }, [stations, teams, organizations]);

  // Group stations by organization -> team hierarchy
  const organizationBuckets: OrganizationBucket[] = useMemo(() => {
    const buckets: Map<string, OrganizationBucket> = new Map();
    
    // Add "Unassigned" bucket for stations without org/team
    buckets.set("unassigned", {
      id: "unassigned",
      name: "Unassigned Stations",
      teams: [{ id: null, name: "Global (No Team)", stations: [] }],
      stationCount: 0,
      ownerName: null,
      ownerEmail: null,
      subscriptionTier: null,
      subscriptionStatus: null,
    });

    // Add organization buckets
    organizations.forEach(org => {
      buckets.set(org.id, {
        id: org.id,
        name: org.name,
        teams: [],
        stationCount: 0,
        ownerName: org.owner_name,
        ownerEmail: org.owner_email,
        subscriptionTier: org.subscription_tier,
        subscriptionStatus: org.subscription_status,
      });
    });

    // Group stations
    enrichedStations.forEach(station => {
      const searchMatch = 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.work_center.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!searchMatch) return;

      const orgId = station.team_id ? 
        (organizations.find(o => teams.some(t => t.id === station.team_id))?.id || "unassigned") 
        : "unassigned";
      
      const bucket = buckets.get(orgId) || buckets.get("unassigned")!;
      
      // Find or create team bucket
      let teamBucket = bucket.teams.find(t => t.id === station.team_id);
      if (!teamBucket) {
        teamBucket = {
          id: station.team_id,
          name: station.team_name || "Global (No Team)",
          stations: [],
        };
        bucket.teams.push(teamBucket);
      }
      
      teamBucket.stations.push(station);
      bucket.stationCount++;
    });

    // Filter and sort
    return Array.from(buckets.values())
      .filter(b => b.stationCount > 0)
      .filter(b => selectedOrg === "all" || b.id === selectedOrg)
      .sort((a, b) => b.stationCount - a.stationCount);
  }, [enrichedStations, organizations, teams, searchQuery, selectedOrg]);

  const filteredStations = enrichedStations.filter(
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
    const teamOrg = teams.find(t => t.id === formData.team_id);
    const orgId = organizations.find(o => teams.some(t => t.id === formData.team_id))?.id;
    const { error } = await createStation({
      station_id: formData.station_id,
      name: formData.name,
      work_center: formData.work_center,
      work_center_type: formData.work_center_type,
      team_id: formData.team_id || null,
      organization_id: orgId || "",
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
            placeholder="Enter station ID"
            value={formData.station_id}
            onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
            disabled={!!editingStation}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Enter display name"
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
            placeholder="Enter work center name"
            value={formData.work_center}
            onChange={(e) => setFormData({ ...formData, work_center: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work_center_type">Type *</Label>
          <WorkCenterTypeCombobox
            value={formData.work_center_type}
            onValueChange={(v) => setFormData({ ...formData, work_center_type: v })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team">Assign to Team</Label>
        <Select
          value={formData.team_id || "none"}
          onValueChange={(v) => setFormData({ ...formData, team_id: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="No team (global)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No team (global)</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStationRow = (station: StationWithOrg, showTeam: boolean = true) => (
    <TableRow key={station.id}>
      <TableCell className="px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-xs sm:text-sm truncate">{station.name}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{station.station_id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{station.work_center}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="secondary">{station.work_center_type}</Badge>
      </TableCell>
      {showTeam && (
        <TableCell className="hidden md:table-cell">
          {station.team_name ? (
            <Badge variant="outline">{station.team_name}</Badge>
          ) : (
            <span className="text-muted-foreground">Global</span>
          )}
        </TableCell>
      )}
      <TableCell>
        {isPlatformAdmin ? (
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
      {isPlatformAdmin && (
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
  );

  return (
    <Card>
      <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Wrench className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Station Management
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {stations.length} stations • {stations.filter((s) => s.is_active).length} active
              </CardDescription>
            </div>
            {isPlatformAdmin && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" size="sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Station</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
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
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Building2 className="w-4 h-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Filter by org" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grouped">
                    <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" />Grouped</span>
                  </SelectItem>
                  <SelectItem value="flat">Flat View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grouped" ? (
          <Accordion type="multiple" defaultValue={organizationBuckets.map(b => b.id)} className="space-y-3">
            {organizationBuckets.map((orgBucket) => (
              <AccordionItem key={orgBucket.id} value={orgBucket.id} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="hover:no-underline px-3 py-2 sm:px-4 sm:py-3 bg-muted/30">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{orgBucket.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {orgBucket.stationCount} stations • {orgBucket.teams.length} teams
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mr-2 sm:mr-4 text-xs shrink-0">
                    <Wrench className="w-3 h-3 mr-1" />
                    {orgBucket.stationCount}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                  {/* Organization Owner Card */}
                  {orgBucket.id !== "unassigned" && orgBucket.ownerName && (
                    <div className="mb-3 p-2.5 rounded-lg border-2 border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm truncate">{orgBucket.ownerName}</span>
                            <Badge variant="default" className="gap-1 text-[10px] px-1.5 py-0">
                              <Crown className="w-2.5 h-2.5" />
                              Owner
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {orgBucket.ownerEmail}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {orgBucket.subscriptionTier && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {orgBucket.subscriptionTier}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {orgBucket.teams.map((teamBucket) => (
                      <Collapsible key={teamBucket.id || "no-team"} defaultOpen className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 rounded-t-lg">
                          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{teamBucket.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {teamBucket.stations.length}
                          </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                              <TableHead>Station</TableHead>
                              <TableHead className="hidden sm:table-cell">Work Center</TableHead>
                              <TableHead className="hidden md:table-cell">Type</TableHead>
                              <TableHead>Status</TableHead>
                              {isPlatformAdmin && <TableHead className="w-10"></TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teamBucket.stations.map((station) => renderStationRow(station, false))}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead className="hidden sm:table-cell">Work Center</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead>Status</TableHead>
                  {isPlatformAdmin && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStations.map((station) => renderStationRow(station, true))}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingStation} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
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
