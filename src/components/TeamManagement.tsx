import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams, useTeamMembers, Team } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useStations";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, UserPlus, Trash2, Crown, Shield, User, Loader2, Wrench, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamStationManager } from "./TeamStationManager";
import { InviteCodeGenerator } from "./InviteCodeGenerator";

export function TeamManagement() {
  const { user } = useAuth();
  const { teams, loading, createTeam, deleteTeam } = useTeams();
  const { toast } = useToast();
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showStationManager, setShowStationManager] = useState(false);
  const [newlyCreatedTeam, setNewlyCreatedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a name for your team.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const { data, error } = await createTeam(newTeamName, newTeamDescription);
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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const { error } = await deleteTeam(teamId);

    if (error) {
      toast({
        title: "Failed to delete team",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Team deleted",
        description: `${teamName} has been deleted.`,
      });
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">
            Manage your teams and collaborate with operators
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Teams allow you to share handoff data with other operators.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="e.g., CNC Department"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Description (optional)</Label>
                <Input
                  id="team-description"
                  placeholder="e.g., All CNC mill and lathe operators"
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
              isSelected={selectedTeam?.id === team.id}
              isOwner={team.created_by === user?.id}
              onSelect={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
              onDelete={() => handleDeleteTeam(team.id, team.name)}
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
          onComplete={() => {
            setShowStationManager(false);
            setNewlyCreatedTeam(null);
          }}
        />
      )}
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  isOwner: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddStations: () => void;
}

function TeamCard({ team, isSelected, isOwner, onSelect, onDelete, onAddStations }: TeamCardProps) {
  const { stations } = useStations(team.id);
  const stationCount = stations.length;

  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/50 ${
        isSelected ? "border-primary" : ""
      }`}
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
                {isOwner && (
                  <Badge variant="secondary" className="text-xs">Owner</Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1">
                  <Wrench className="w-3 h-3" />
                  {stationCount}
                </Badge>
              </div>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2">
          {team.description || "No description"}
        </CardDescription>
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
                <DialogContent>
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
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
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
                    <p className="text-xs text-muted-foreground">
                      {member.profile?.email || "No email"}
                    </p>
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
