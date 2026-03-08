import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams, useTeamMembers, Team } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useStations, Station } from "@/hooks/useStations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, UserPlus, Trash2, Crown, Shield, User, Loader2, Wrench, QrCode, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamStationManager } from "./TeamStationManager";
import { InviteCodeGenerator } from "./InviteCodeGenerator";
import { SafeDeleteDialog } from "./ui/safe-delete-dialog";

export function TeamManagement() {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const { isOrgAdmin, isAdmin } = useAdminAccess();
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { stations: allStations, refreshStations } = useStations(undefined, organization?.id);
  const { toast } = useToast();
  const [optimisticStations, setOptimisticStations] = useState<Station[]>([]);
  const [isUsingOptimisticStations, setIsUsingOptimisticStations] = useState(false);

  useEffect(() => {
    if (!isUsingOptimisticStations) {
      setOptimisticStations(allStations);
    }
  }, [allStations, isUsingOptimisticStations]);

  const stationsForDisplay = isUsingOptimisticStations ? optimisticStations : allStations;

  const stationCountByTeam = useMemo(
    () =>
      stationsForDisplay.reduce<Record<string, number>>((acc, station) => {
        if (!station.team_id) return acc;
        acc[station.team_id] = (acc[station.team_id] || 0) + 1;
        return acc;
      }, {}),
    [stationsForDisplay],
  );

  const applyOptimisticReassignment = (stationId: string, toTeamId: string) => {
    setIsUsingOptimisticStations(true);
    setOptimisticStations((prev) => {
      const base = prev.length ? prev : allStations;
      return base.map((station) =>
        station.id === stationId ? { ...station, team_id: toTeamId } : station,
      );
    });
  };

  const rollbackOptimisticReassignment = (stationId: string, fromTeamId: string | null) => {
    setOptimisticStations((prev) =>
      prev.map((station) =>
        station.id === stationId ? { ...station, team_id: fromTeamId } : station,
      ),
    );
  };

  const finalizeOptimisticReassignment = async () => {
    await refreshStations();
    setIsUsingOptimisticStations(false);
  };

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showStationManager, setShowStationManager] = useState(false);
  const [newlyCreatedTeam, setNewlyCreatedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit team state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation state
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a name for your team.",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: "No organization",
        description: "You must belong to an organization to create teams.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const { data, error } = await createTeam(newTeamName, newTeamDescription, organization.id);
    setIsCreating(false);

    if (error) {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Team created!",
        description: `${newTeamName} has been created successfully.`,
      });
      setShowCreateDialog(false);

      // Store the created team and prompt for station setup
      if (data) {
        setNewlyCreatedTeam(data);
        setShowStationManager(true);
      }

      setNewTeamName("");
      setNewTeamDescription("");
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingTeam || !editTeamName.trim()) return;
    setIsSavingEdit(true);
    const { error } = await updateTeam(editingTeam.id, {
      name: editTeamName.trim(),
      description: editTeamDescription.trim() || undefined,
    });
    setIsSavingEdit(false);

    if (error) {
      toast({ title: "Failed to update team", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team updated", description: `${editTeamName} has been updated.` });
      setEditingTeam(null);
    }
  };

  const handleRequestDelete = (team: Team) => {
    setDeletingTeam(team);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTeam) return;
    const { error } = await deleteTeam(deletingTeam.id);
    if (error) {
      toast({ title: "Failed to delete team", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team deleted", description: `${deletingTeam.name} has been deleted.` });
      if (selectedTeam?.id === deletingTeam.id) {
        setSelectedTeam(null);
      }
    }
    setDeletingTeam(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">Manage your teams and collaborate with operators</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>Teams allow you to share handoff data with other operators.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Description (optional)</Label>
                <Input
                  id="team-description"
                  placeholder="Describe this team"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Team"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create a team to collaborate with other operators and share handoff data.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                stationCount={stationCountByTeam[team.id] || 0}
                isSelected={selectedTeam?.id === team.id}
                canManage={team.created_by === user?.id || isOrgAdmin || isAdmin}
                onSelect={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
                onEdit={() => handleEditTeam(team)}
                onDelete={() => handleRequestDelete(team)}
                onAddStations={() => {
                  setNewlyCreatedTeam(team);
                  setShowStationManager(true);
                }}
              />
          ))}
        </div>
      )}

      {/* Team Members Panel */}
      {selectedTeam && (
        <TeamMembersPanel
          team={selectedTeam}
          showInviteDialog={showInviteDialog}
          setShowInviteDialog={setShowInviteDialog}
        />
      )}

      {/* Station Manager Dialog */}
      {newlyCreatedTeam && (
        <TeamStationManager
          teamId={newlyCreatedTeam.id}
          teamName={newlyCreatedTeam.name}
          open={showStationManager}
          onOpenChange={setShowStationManager}
          onReassignOptimistic={({ stationId, toTeamId }) => applyOptimisticReassignment(stationId, toTeamId)}
          onReassignRollback={({ stationId, fromTeamId }) => rollbackOptimisticReassignment(stationId, fromTeamId)}
          onReassignCommitted={finalizeOptimisticReassignment}
          onComplete={() => {
            setShowStationManager(false);
            setNewlyCreatedTeam(null);
          }}
        />
      )}

      {/* Edit Team Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-desc">Description (optional)</Label>
              <Input
                id="edit-team-desc"
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit || !editTeamName.trim()}>
              {isSavingEdit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <SafeDeleteDialog
        open={!!deletingTeam}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
        confirmValue={deletingTeam?.name || ""}
        title="Delete Team"
        description={
          <>
            This action is permanent. All stations in this team will be unassigned. Type{" "}
            <span className="font-mono font-bold text-foreground">{deletingTeam?.name}</span> to confirm.
          </>
        }
        deleteLabel="Delete Team"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  stationCount: number;
  isSelected: boolean;
  canManage: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddStations: () => void;
}

function TeamCard({ team, stationCount, isSelected, canManage, onSelect, onEdit, onDelete, onAddStations }: TeamCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/50 ${isSelected ? "border-primary" : ""}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{team.name}</CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                {canManage && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1">
                  <Wrench className="w-3 h-3" />
                  {stationCount}
                </Badge>
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit team"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete team"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2">{team.description || "No description"}</CardDescription>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddStations();
          }}
        >
          <Wrench className="w-4 h-4" />
          {stationCount > 0 ? "Manage Stations" : "Add Stations"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamMembersPanel({
  team,
  showInviteDialog,
  setShowInviteDialog,
}: {
  team: Team;
  showInviteDialog: boolean;
  setShowInviteDialog: (show: boolean) => void;
}) {
  const { user } = useAuth();
  const { members, loading, addMember, updateMemberRole, removeMember } = useTeamMembers(team.id);
  const { toast } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);

  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === "owner" || currentUserMember?.role === "admin";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    const { error } = await addMember(inviteEmail, inviteRole);
    setIsInviting(false);

    if (error) {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Member added!",
        description: `${inviteEmail} has been added to the team.`,
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("member");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const { error } = await removeMember(memberId);

    if (error) {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the team.`,
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{team.name} Members</CardTitle>
            <CardDescription>{members.length} member(s)</CardDescription>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Dialog open={showInviteCodeDialog} onOpenChange={setShowInviteCodeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    Invite Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generate Invite Code for {team.name}</DialogTitle>
                    <DialogDescription>
                      Create an invite code that automatically adds new members to this team
                    </DialogDescription>
                  </DialogHeader>
                  <InviteCodeGenerator defaultTeamId={team.id} />
                </DialogContent>
              </Dialog>

              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Invite a user to join {team.name}. They must already have an account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="operator@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Member"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {member.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {member.profile?.display_name || "Unknown User"}
                      {getRoleIcon(member.role)}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.profile?.email || "No email"}</p>
                  </div>
                </div>

                {isAdmin && member.role !== "owner" && member.user_id !== user?.id && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(v) => updateMemberRole(member.id, v as "admin" | "member")}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id, member.profile?.display_name || "User")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
