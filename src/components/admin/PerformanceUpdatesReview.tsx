import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Building2,
  Wrench,
  User,
  Calendar,
  Search,
  Filter,
  Loader2,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PerformanceUpdate {
  id: string;
  team_id: string | null;
  station_id: string | null;
  user_id: string;
  user_name: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  update_type: string;
  priority: string;
  title: string;
  description: string;
  proposed_solution: string | null;
  expected_benefit: string | null;
  affects_cycle_time: boolean;
  affects_quality: boolean;
  affects_safety: boolean;
  requires_tooling_change: boolean;
  requires_program_update: boolean;
  requires_fixture_modification: boolean;
  requires_engineering_review: boolean;
  requires_qa_approval: boolean;
  status: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  assigned_station_id: string | null;
  assigned_team_id: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  created_at: string;
  image_urls: string[];
}

interface Team {
  id: string;
  name: string;
}

interface Station {
  id: string;
  name: string;
  station_id: string;
  team_id: string | null;
}

interface PerformanceUpdatesReviewProps {
  isAdmin: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  reviewed: "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  approved: "bg-status-ok/10 text-status-ok border-status-ok/30",
  implemented: "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30",
  rejected: "bg-status-critical/10 text-status-critical border-status-critical/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-status-waiting/10 text-status-waiting",
  high: "bg-priority-urgent/10 text-priority-urgent",
  critical: "bg-status-critical/10 text-status-critical",
};

export function PerformanceUpdatesReview({ isAdmin }: PerformanceUpdatesReviewProps) {
  const { user, profile } = useAuth();
  const { organization } = useOrgContext();
  const { toast } = useToast();
  
  const [updates, setUpdates] = useState<PerformanceUpdate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<PerformanceUpdate | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [assignStationId, setAssignStationId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch updates
    const { data: updatesData } = await supabase
      .from("job_performance_updates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (updatesData) {
      setUpdates(updatesData as PerformanceUpdate[]);
    }
    
    // Fetch teams for assignment
    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");
    
    if (teamsData) {
      setTeams(teamsData);
    }
    
    // Fetch stations for assignment
    const { data: stationsData } = await supabase
      .from("stations")
      .select("id, name, station_id, team_id")
      .eq("is_active", true)
      .order("name");
    
    if (stationsData) {
      setStations(stationsData);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("admin-performance-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_performance_updates" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const filteredUpdates = updates.filter((update) => {
    const matchesStatus = statusFilter === "all" || update.status === statusFilter;
    const matchesSearch = !searchQuery || 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.work_order?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.part_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenReview = (update: PerformanceUpdate) => {
    setSelectedUpdate(update);
    setReviewNotes(update.review_notes || "");
    setAssignStationId(update.assigned_station_id || "");
    setAssignTeamId(update.assigned_team_id || "");
    setReviewDialogOpen(true);
  };

  const handleReviewAction = async (action: "approved" | "rejected" | "reviewed") => {
    if (!selectedUpdate || !user || !profile) return;
    
    setIsSubmitting(true);
    
    const updateData: Record<string, any> = {
      status: action,
      reviewer_id: user.id,
      reviewer_name: profile.display_name,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
    };
    
    // If approving and assigning
    if (action === "approved") {
      if (assignStationId && assignStationId !== "none") {
        updateData.assigned_station_id = assignStationId;
      }
      if (assignTeamId && assignTeamId !== "none") {
        updateData.assigned_team_id = assignTeamId;
      }
      if (assignStationId || assignTeamId) {
        updateData.assigned_at = new Date().toISOString();
        updateData.assigned_by = user.id;
      }
    }
    
    const { error } = await supabase
      .from("job_performance_updates")
      .update(updateData)
      .eq("id", selectedUpdate.id);
    
    setIsSubmitting(false);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Update ${action === "approved" ? "approved" : action === "rejected" ? "rejected" : "reviewed"}` 
      });
      setReviewDialogOpen(false);
      setSelectedUpdate(null);
      
      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        activity_type: "handoff_updated",
        description: `Performance update "${selectedUpdate.title}" ${action}`,
        metadata: {
          update_id: selectedUpdate.id,
          action,
          assigned_station_id: assignStationId || null,
          assigned_team_id: assignTeamId || null,
        },
      });
    }
  };

  const getImpactBadges = (update: PerformanceUpdate) => {
    const badges = [];
    if (update.affects_cycle_time) badges.push("Cycle Time");
    if (update.affects_quality) badges.push("Quality");
    if (update.affects_safety) badges.push("Safety");
    return badges;
  };

  const getRequirementBadges = (update: PerformanceUpdate) => {
    const badges = [];
    if (update.requires_tooling_change) badges.push("Tooling");
    if (update.requires_program_update) badges.push("Program");
    if (update.requires_fixture_modification) badges.push("Fixture");
    if (update.requires_engineering_review) badges.push("Engineering");
    if (update.requires_qa_approval) badges.push("QA");
    return badges;
  };

  const pendingCount = updates.filter(u => u.status === "pending").length;
  const approvedCount = updates.filter(u => u.status === "approved").length;
  const rejectedCount = updates.filter(u => u.status === "rejected").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Performance Updates Review
            </CardTitle>
            <CardDescription>
              Review, approve, and assign operator-submitted improvements
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              {approvedCount} Approved
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, user, work order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Updates List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredUpdates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No updates found</p>
              </div>
            ) : (
              filteredUpdates.map((update) => (
                <div
                  key={update.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleOpenReview(update)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{update.title}</h4>
                        <Badge className={priorityColors[update.priority]} variant="outline">
                          {update.priority}
                        </Badge>
                        <Badge className={statusColors[update.status]} variant="outline">
                          {update.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {update.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {update.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                        {update.work_order && (
                          <span>WO: {update.work_order}</span>
                        )}
                        {update.part_number && (
                          <span>PN: {update.part_number}</span>
                        )}
                      </div>
                      {/* Impact badges */}
                      {getImpactBadges(update).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getImpactBadges(update).map((badge) => (
                            <Badge key={badge} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Review Performance Update</DialogTitle>
            <DialogDescription>
              Review the details and approve, reject, or request changes
            </DialogDescription>
          </DialogHeader>

          {selectedUpdate && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedUpdate.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted by {selectedUpdate.user_name} • {formatDistanceToNow(new Date(selectedUpdate.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={priorityColors[selectedUpdate.priority]}>
                    {selectedUpdate.priority}
                  </Badge>
                  <Badge className={statusColors[selectedUpdate.status]}>
                    {selectedUpdate.status}
                  </Badge>
                </div>
              </div>

              {/* Context */}
              {(selectedUpdate.work_order || selectedUpdate.part_number || selectedUpdate.operation_number) && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/50 rounded-lg">
                  {selectedUpdate.work_order && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Work Order</Label>
                      <p className="font-medium">{selectedUpdate.work_order}</p>
                    </div>
                  )}
                  {selectedUpdate.part_number && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Part Number</Label>
                      <p className="font-medium">{selectedUpdate.part_number}</p>
                    </div>
                  )}
                  {selectedUpdate.operation_number && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Operation</Label>
                      <p className="font-medium">{selectedUpdate.operation_number}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedUpdate.description}</p>
              </div>

              {/* Proposed Solution */}
              {selectedUpdate.proposed_solution && (
                <div>
                  <Label className="text-xs text-muted-foreground">Proposed Solution</Label>
                  <p className="mt-1">{selectedUpdate.proposed_solution}</p>
                </div>
              )}

              {/* Expected Benefit */}
              {selectedUpdate.expected_benefit && (
                <div>
                  <Label className="text-xs text-muted-foreground">Expected Benefit</Label>
                  <p className="mt-1">{selectedUpdate.expected_benefit}</p>
                </div>
              )}

              {/* Impact & Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Impacts</Label>
                  <div className="flex flex-wrap gap-1">
                    {getImpactBadges(selectedUpdate).map((badge) => (
                      <Badge key={badge} variant="secondary">{badge}</Badge>
                    ))}
                    {getImpactBadges(selectedUpdate).length === 0 && (
                      <span className="text-sm text-muted-foreground">None specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Requirements</Label>
                  <div className="flex flex-wrap gap-1">
                    {getRequirementBadges(selectedUpdate).map((badge) => (
                      <Badge key={badge} variant="outline">{badge}</Badge>
                    ))}
                    {getRequirementBadges(selectedUpdate).length === 0 && (
                      <span className="text-sm text-muted-foreground">None specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignment (only show for approval) */}
              <div className="border-t pt-4 space-y-3">
                <Label className="font-medium">Assignment (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Assign to Team</Label>
                    <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                      <SelectTrigger>
                        <Building2 className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No assignment</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Assign to Station</Label>
                    <Select value={assignStationId} onValueChange={setAssignStationId}>
                      <SelectTrigger>
                        <Wrench className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No assignment</SelectItem>
                        {stations
                          .filter(s => !assignTeamId || assignTeamId === "none" || s.team_id === assignTeamId)
                          .map((station) => (
                            <SelectItem key={station.id} value={station.id}>
                              {station.name} ({station.station_id})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add notes for the submitter..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReviewAction("rejected")}
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReviewAction("reviewed")}
              disabled={isSubmitting}
            >
              <Clock className="w-4 h-4 mr-2" />
              Mark Reviewed
            </Button>
            <Button
              onClick={() => handleReviewAction("approved")}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
