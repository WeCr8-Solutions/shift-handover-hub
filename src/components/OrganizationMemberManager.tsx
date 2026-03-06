import { useState } from "react";
import { useOrganizationMembers, OrganizationMember } from "@/hooks/useOrganizationMembers";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { useEmail } from "@/hooks/useEmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Crown,
  Shield,
  UserCog,
  Loader2,
  Trash2,
  Search,
  Copy,
  Mail,
  Link,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ORG_ROLE_CONFIG = {
  owner: { label: "Owner", icon: Crown, color: "text-yellow-600" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-600" },
  member: { label: "Member", icon: Users, color: "text-muted-foreground" },
};

const APP_ROLE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  supervisor: {
    label: "Supervisor",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    description: "Can oversee teams and review performance updates",
  },
  operator: {
    label: "Operator",
    color: "bg-green-500/10 text-green-700 border-green-200",
    description: "Can submit handoffs and performance updates",
  },
};

type DialogStep = "form" | "user-not-found" | "invite-created";

interface InviteDetails {
  code: string;
  link: string;
  email: string;
}

export function OrganizationMemberManager() {
  const { user, profile } = useAuth();
  const { organization, organizationRole } = useUserOrganization();
  const {
    members,
    loading,
    isOrgAdmin,
    addMember,
    createPersonalInvite,
    updateMemberOrgRole,
    removeMember,
    assignAppRole,
    removeAppRole,
  } = useOrganizationMembers(organization?.id || null);
  const { sendTeamInviteEmail } = useEmail();
  const { toast } = useToast();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("form");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgRole, setInviteOrgRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<InviteDetails | null>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.profile?.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetDialog = () => {
    setDialogStep("form");
    setInviteEmail("");
    setInviteOrgRole("member");
    setCreatedInvite(null);
  };

  const handleCloseDialog = () => {
    setShowInviteDialog(false);
    resetDialog();
  };

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
    const result = await addMember(inviteEmail, inviteOrgRole);
    setIsInviting(false);

    if (result.error) {
      toast({
        title: "Failed to add member",
        description: result.error.message,
        variant: "destructive",
      });
    } else if (result.userNotFound) {
      // User doesn't exist - show create invite prompt
      setDialogStep("user-not-found");
    } else {
      toast({
        title: "Member added!",
        description: `${inviteEmail} has been added to the organization.`,
      });
      handleCloseDialog();
    }
  };

  const handleCreateInvite = async (sendEmail: boolean = false) => {
    setIsInviting(true);
    const result = await createPersonalInvite(inviteEmail, inviteOrgRole);
    setIsInviting(false);

    if (result.error) {
      toast({
        title: "Failed to create invite",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }

    if (result.inviteCreated) {
      setCreatedInvite(result.inviteCreated);
      setDialogStep("invite-created");

      if (sendEmail) {
        setIsSendingEmail(true);
        const emailResult = await sendTeamInviteEmail(
          inviteEmail,
          profile?.display_name || "An admin",
          organization?.name || "the organization",
          result.inviteCreated.link,
          inviteOrgRole
        );
        setIsSendingEmail(false);

        if (emailResult.success) {
          toast({
            title: "Invite sent!",
            description: `Invitation email sent to ${inviteEmail}.`,
          });
        } else {
          toast({
            title: "Invite created, email failed",
            description: "The invite was created but email failed to send. You can share the link manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invite created!",
          description: `Personal invite for ${inviteEmail} is ready.`,
        });
      }
    }
  };

  const handleCopyCode = () => {
    if (createdInvite) {
      navigator.clipboard.writeText(createdInvite.code);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    }
  };

  const handleCopyLink = () => {
    if (createdInvite) {
      navigator.clipboard.writeText(createdInvite.link);
      toast({ title: "Copied!", description: "Invite link copied to clipboard." });
    }
  };

  const handleResendEmail = async () => {
    if (!createdInvite) return;
    
    setIsSendingEmail(true);
    const emailResult = await sendTeamInviteEmail(
      createdInvite.email,
      profile?.display_name || "An admin",
      organization?.name || "the organization",
      createdInvite.link,
      inviteOrgRole
    );
    setIsSendingEmail(false);

    if (emailResult.success) {
      toast({ title: "Email sent!", description: `Invitation sent to ${createdInvite.email}.` });
    } else {
      toast({ title: "Failed to send", description: "Could not send email.", variant: "destructive" });
    }
  };

  const handleUpdateOrgRole = async (member: OrganizationMember, newRole: "admin" | "member") => {
    setUpdatingMember(member.id);
    const { error } = await updateMemberOrgRole(member.id, newRole);
    setUpdatingMember(null);

    if (error) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Role updated",
        description: `${member.profile?.display_name}'s organization role has been updated.`,
      });
    }
  };

  const handleToggleAppRole = async (member: OrganizationMember, role: AppRole) => {
    setUpdatingMember(member.user_id);
    const hasRole = member.app_roles?.includes(role);

    const { error } = hasRole
      ? await removeAppRole(member.user_id, role)
      : await assignAppRole(member.user_id, role);

    setUpdatingMember(null);

    if (error) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: hasRole ? "Role removed" : "Role assigned",
        description: `${hasRole ? "Removed" : "Assigned"} ${role} role for ${member.profile?.display_name}.`,
      });
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    setUpdatingMember(member.id);
    const { error } = await removeMember(member.id);
    setUpdatingMember(null);

    if (error) {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Member removed",
        description: `${member.profile?.display_name} has been removed from the organization.`,
      });
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Organization</h3>
          <p className="text-sm text-muted-foreground text-center">
            You need to create or join an organization first.
          </p>
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
              <Users className="w-5 h-5" />
              Organization Members
            </CardTitle>
            <CardDescription>
              {members.length} member(s) in {organization.name}
              {isOrgAdmin && " • You can manage members and assign roles"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isOrgAdmin && (
              <Dialog open={showInviteDialog} onOpenChange={(open) => {
                if (!open) handleCloseDialog();
                else setShowInviteDialog(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  {dialogStep === "form" && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Add Organization Member</DialogTitle>
                        <DialogDescription>
                          Add a user to {organization.name}. If they don't have an account, you can create a personal invite.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="user@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Organization Role</Label>
                          <Select
                            value={inviteOrgRole}
                            onValueChange={(v) => setInviteOrgRole(v as "admin" | "member")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin (can manage org members)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                          Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={isInviting}>
                          {isInviting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            "Add Member"
                          )}
                        </Button>
                      </DialogFooter>
                    </>
                  )}

                  {dialogStep === "user-not-found" && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          User Not Found
                        </DialogTitle>
                        <DialogDescription>
                          No account exists for <strong>{inviteEmail}</strong>. Would you like to create a personal invite?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">The invite will:</p>
                        <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                          <li>Be reserved for this email address</li>
                          <li>Expire in 7 days</li>
                          <li>Grant them <strong className="text-foreground">{inviteOrgRole === "admin" ? "Admin" : "Member"}</strong> role when they sign up</li>
                        </ul>
                      </div>
                      <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={() => setDialogStep("form")}>
                          Back
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => handleCreateInvite(false)} 
                          disabled={isInviting}
                          className="gap-2"
                        >
                          {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                          Create & Copy Link
                        </Button>
                        <Button 
                          onClick={() => handleCreateInvite(true)} 
                          disabled={isInviting}
                          className="gap-2"
                        >
                          {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          Create & Send Email
                        </Button>
                      </DialogFooter>
                    </>
                  )}

                  {dialogStep === "invite-created" && createdInvite && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Invite Created
                        </DialogTitle>
                        <DialogDescription>
                          Personal invite for <strong>{createdInvite.email}</strong> is ready to share.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Invite Code</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                              {createdInvite.code}
                            </code>
                            <Button variant="outline" size="icon" onClick={handleCopyCode}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Invite Link</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              readOnly 
                              value={createdInvite.link} 
                              className="text-xs font-mono"
                            />
                            <Button variant="outline" size="icon" onClick={handleCopyLink}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button 
                          variant="outline" 
                          onClick={handleResendEmail}
                          disabled={isSendingEmail}
                          className="gap-2"
                        >
                          {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          Send Email
                        </Button>
                        <Button onClick={handleCloseDialog}>
                          Done
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Org Role</TableHead>
                <TableHead>App Roles</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Joined</TableHead>
                {isOrgAdmin && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const orgRoleConfig = ORG_ROLE_CONFIG[member.role as keyof typeof ORG_ROLE_CONFIG] || ORG_ROLE_CONFIG.member;
                const OrgRoleIcon = orgRoleConfig.icon;
                const isSelf = member.user_id === user?.id;
                const isOwner = member.role === "owner";

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profile?.display_name || "Unknown"}
                            {isSelf && <span className="text-muted-foreground ml-1">(You)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profile?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <OrgRoleIcon className={`w-4 h-4 ${orgRoleConfig.color}`} />
                        <span>{orgRoleConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.app_roles?.map((role) => {
                          const config = APP_ROLE_CONFIG[role];
                          if (!config) return null;
                          return (
                            <Badge
                              key={role}
                              variant="outline"
                              className={config.color}
                            >
                              {config.label}
                            </Badge>
                          );
                        })}
                        {(!member.app_roles || member.app_roles.length === 0) && (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.team_memberships && member.team_memberships.length > 0 ? (
                          member.team_memberships.map((tm, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tm.team_name}
                              <span className="ml-1 text-muted-foreground">({tm.team_role})</span>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No team</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </TableCell>
                    {isOrgAdmin && (
                      <TableCell>
                        {updatingMember === member.id || updatingMember === member.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isOwner && isSelf}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {!isOwner && (
                                <>
                                  <DropdownMenuLabel>Organization Role</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateOrgRole(member, "admin")}
                                    disabled={member.role === "admin"}
                                  >
                                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateOrgRole(member, "member")}
                                    disabled={member.role === "member"}
                                  >
                                    <Users className="w-4 h-4 mr-2" />
                                    Make Member
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuLabel>App Roles</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleToggleAppRole(member, "supervisor")}
                              >
                                <UserCog className="w-4 h-4 mr-2 text-blue-600" />
                                {member.app_roles?.includes("supervisor")
                                  ? "Remove Supervisor"
                                  : "Assign Supervisor"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleAppRole(member, "operator")}
                              >
                                <Users className="w-4 h-4 mr-2 text-green-600" />
                                {member.app_roles?.includes("operator")
                                  ? "Remove Operator"
                                  : "Assign Operator"}
                              </DropdownMenuItem>
                              {!isOwner && !isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveMember(member)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove from Organization
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
