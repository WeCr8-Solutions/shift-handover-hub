import { useState, useMemo } from "react";
import { useOrganizationMembers, OrganizationMember } from "@/hooks/useOrganizationMembers";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEmail } from "@/hooks/useEmail";
import { useEntitlements } from "@/hooks/useEntitlements";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  X,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ORG_ROLE_CONFIG = {
  owner: { label: "Owner", icon: Crown, color: "text-warning" },
  admin: { label: "Admin", icon: Shield, color: "text-role-org-admin" },
  member: { label: "Member", icon: Users, color: "text-muted-foreground" },
} as const;

const APP_ROLE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  supervisor: {
    label: "Supervisor",
    color: "bg-role-supervisor/10 text-role-supervisor border-role-supervisor/20",
    description: "Can oversee teams and review performance updates",
  },
  operator: {
    label: "Operator",
    color: "bg-role-operator/10 text-role-operator border-role-operator/20",
    description: "Can submit handoffs and performance updates",
  },
};

type DialogStep = "form" | "user-not-found" | "invite-created";

interface InviteDetails {
  code: string;
  link: string;
  email: string;
}

// ─── Small helper: avatar initials ──────────────────────────────────────────
function memberInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
}

// ─── Inline copy button with transient "Copied!" state ──────────────────────
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="icon" onClick={handleCopy} aria-label={`Copy ${label}`} className="shrink-0">
      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface OrganizationMemberManagerProps {
  onNavigateToInvites?: () => void;
}

export function OrganizationMemberManager({ onNavigateToInvites }: OrganizationMemberManagerProps) {
  const { user, profile } = useAuth();
  const { organization, organizationRole } = useOrgContext();
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
  const { limits, loading: entitlementsLoading } = useEntitlements();
  const seatLimit = limits?.users ?? 1;
  const seatsUsed = members.length;
  const seatsAvailable = Math.max(0, seatLimit - seatsUsed);
  const { toast } = useToast();

  // ── Invite dialog state ──────────────────────────────────────────────────
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("form");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgRole, setInviteOrgRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<InviteDetails | null>(null);

  // ── Table state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);

  // ── Remove-member confirmation ───────────────────────────────────────────
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);

  // ── Filtered members (memoised) ──────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.profile?.display_name?.toLowerCase().includes(q) || m.profile?.email?.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  // ── Dialog helpers ────────────────────────────────────────────────────────
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

  // ── Invite actions ────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Email required", description: "Please enter an email address.", variant: "destructive" });
      return;
    }

    setIsInviting(true);
    const result = await addMember(inviteEmail, inviteOrgRole);
    setIsInviting(false);

    if (result.error) {
      toast({ title: "Failed to add member", description: result.error.message, variant: "destructive" });
    } else if (result.userNotFound) {
      setDialogStep("user-not-found");
    } else {
      toast({ title: "Member added!", description: `${inviteEmail} has been added to the organization.` });
      handleCloseDialog();
    }
  };

  const handleCreateInvite = async (sendEmail: boolean = false) => {
    setIsInviting(true);
    const result = await createPersonalInvite(inviteEmail, inviteOrgRole);
    setIsInviting(false);

    if (result.error) {
      toast({ title: "Failed to create invite", description: result.error.message, variant: "destructive" });
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
          inviteOrgRole,
        );
        setIsSendingEmail(false);

        toast(
          emailResult.success
            ? { title: "Invite sent!", description: `Invitation email sent to ${inviteEmail}.` }
            : {
                title: "Invite created, email failed",
                description: "The invite was created but the email failed to send. Share the link manually.",
                variant: "destructive",
              },
        );
      } else {
        toast({ title: "Invite created!", description: `Personal invite for ${inviteEmail} is ready.` });
      }
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
      inviteOrgRole,
    );
    setIsSendingEmail(false);

    toast(
      emailResult.success
        ? { title: "Email sent!", description: `Invitation sent to ${createdInvite.email}.` }
        : { title: "Failed to send", description: "Could not send email.", variant: "destructive" },
    );
  };

  // ── Member management actions ─────────────────────────────────────────────
  const handleUpdateOrgRole = async (member: OrganizationMember, newRole: "admin" | "member") => {
    setUpdatingMember(member.id);
    const { error } = await updateMemberOrgRole(member.id, newRole);
    setUpdatingMember(null);

    if (error) {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
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
    const { error } = hasRole ? await removeAppRole(member.user_id, role) : await assignAppRole(member.user_id, role);
    setUpdatingMember(null);

    if (error) {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: hasRole ? "Role removed" : "Role assigned",
        description: `${hasRole ? "Removed" : "Assigned"} ${role} for ${member.profile?.display_name}.`,
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setUpdatingMember(memberToRemove.id);
    const { error } = await removeMember(memberToRemove.id);
    setUpdatingMember(null);
    setMemberToRemove(null);

    if (error) {
      toast({ title: "Failed to remove member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed", description: `${memberToRemove.profile?.display_name} has been removed.` });
    }
  };

  // ── No org guard ─────────────────────────────────────────────────────────
  if (!organization) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Organization</h3>
          <p className="text-sm text-muted-foreground text-center">You need to create or join an organization first.</p>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organization Members
                <Badge variant="secondary" className="ml-1 font-mono">
                  {members.length}
                </Badge>
                <Badge variant={seatsAvailable > 0 ? "outline" : "destructive"} className="ml-1 font-mono text-xs">
                  {seatsUsed}/{seatLimit} seats
                </Badge>
              </CardTitle>
              <CardDescription>
                {organization.name}
                {isOrgAdmin && " · You can manage members and assign roles"}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search members…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                  aria-label="Search members"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Invite dialog */}
              {isOrgAdmin && (
                <Dialog
                  open={showInviteDialog}
                  onOpenChange={(open) => (open ? setShowInviteDialog(true) : handleCloseDialog())}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2 shrink-0">
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    {/* ── Step: form ── */}
                    {dialogStep === "form" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Add Organization Member</DialogTitle>
                          <DialogDescription>
                            Add a user to {organization.name}. If they don't have an account yet, you can create a
                            personal invite.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-1">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="user@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">Organization Role</Label>
                            <Select
                              value={inviteOrgRole}
                              onValueChange={(v) => setInviteOrgRole(v as "admin" | "member")}
                            >
                              <SelectTrigger id="invite-role">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin — can manage org members</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCloseDialog}>
                            Cancel
                          </Button>
                          <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                            {isInviting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking…
                              </>
                            ) : (
                              "Add Member"
                            )}
                          </Button>
                        </DialogFooter>
                      </>
                    )}

                    {/* ── Step: user-not-found ── */}
                    {dialogStep === "user-not-found" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            User Not Found
                          </DialogTitle>
                          <DialogDescription>
                            No account exists for <strong>{inviteEmail}</strong>. Create a personal invite for them to
                            sign up with.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1 text-muted-foreground">
                          <p>The invite will:</p>
                          <ul className="ml-4 list-disc space-y-0.5">
                            <li>Be reserved for this email address only</li>
                            <li>Expire in 7 days</li>
                            <li>
                              Grant{" "}
                              <strong className="text-foreground">
                                {inviteOrgRole === "admin" ? "Admin" : "Member"}
                              </strong>{" "}
                              role on sign-up
                            </li>
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
                            Create &amp; Copy Link
                          </Button>
                          <Button onClick={() => handleCreateInvite(true)} disabled={isInviting} className="gap-2">
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Create &amp; Send Email
                          </Button>
                        </DialogFooter>
                      </>
                    )}

                    {/* ── Step: invite-created ── */}
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
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Invite Code</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm truncate">
                                {createdInvite.code}
                              </code>
                              <CopyButton value={createdInvite.code} label="invite code" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Invite Link</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                readOnly
                                value={createdInvite.link}
                                className="text-xs font-mono"
                                aria-label="Invite link"
                              />
                              <CopyButton value={createdInvite.link} label="invite link" />
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
                            {isSendingEmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Resend Email
                          </Button>
                          <Button onClick={handleCloseDialog}>Done</Button>
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">{searchQuery ? "No members match your search" : "No members yet"}</p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="mt-1">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Org Role</TableHead>
                  <TableHead>App Roles</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Joined</TableHead>
                  {isOrgAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const orgRoleConfig =
                    ORG_ROLE_CONFIG[member.role as keyof typeof ORG_ROLE_CONFIG] ?? ORG_ROLE_CONFIG.member;
                  const OrgRoleIcon = orgRoleConfig.icon;
                  const isSelf = member.user_id === user?.id;
                  const isOwner = member.role === "owner";
                  const isBusy = updatingMember === member.id || updatingMember === member.user_id;

                  return (
                    <TableRow key={member.id}>
                      {/* Member */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {memberInitials(member.profile?.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {member.profile?.display_name || "Unknown"}
                              {isSelf && <span className="text-muted-foreground font-normal ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{member.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Org role */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <OrgRoleIcon className={`w-4 h-4 shrink-0 ${orgRoleConfig.color}`} />
                          <span className="text-sm">{orgRoleConfig.label}</span>
                        </div>
                      </TableCell>

                      {/* App roles */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.app_roles && member.app_roles.length > 0 ? (
                            member.app_roles.map((role) => {
                              const config = APP_ROLE_CONFIG[role];
                              return config ? (
                                <Badge key={role} variant="outline" className={config.color}>
                                  {config.label}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Teams */}
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
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      {/* Seat */}
                      <TableCell>
                        <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                          <CheckCircle className="w-3 h-3" />
                          Assigned
                        </Badge>
                      </TableCell>

                      {/* Joined */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </TableCell>

                      {/* Actions */}
                      {isOrgAdmin && (
                        <TableCell>
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={isOwner && isSelf}
                                  aria-label={`Actions for ${member.profile?.display_name}`}
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
                                <DropdownMenuItem onClick={() => handleToggleAppRole(member, "supervisor")}>
                                  <UserCog className="w-4 h-4 mr-2 text-blue-600" />
                                  {member.app_roles?.includes("supervisor") ? "Remove Supervisor" : "Assign Supervisor"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAppRole(member, "operator")}>
                                  <Users className="w-4 h-4 mr-2 text-green-600" />
                                  {member.app_roles?.includes("operator") ? "Remove Operator" : "Assign Operator"}
                                </DropdownMenuItem>
                                {!isOwner && !isSelf && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setMemberToRemove(member)}
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
                {/* Unassigned seat rows */}
                {seatsAvailable > 0 && Array.from({ length: Math.min(seatsAvailable, 3) }).map((_, i) => (
                  <TableRow key={`empty-seat-${i}`} className="opacity-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">?</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground italic">Open seat</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>
                    <TableCell>
                      {isOrgAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => {
                            if (onNavigateToInvites) {
                              onNavigateToInvites();
                            } else {
                              setShowInviteDialog(true);
                            }
                          }}
                        >
                          <UserPlus className="w-3 h-3" />
                          Create Invite
                        </Button>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>
                    {isOrgAdmin && <TableCell />}
                  </TableRow>
                ))}
                {seatsAvailable > 3 && (
                  <TableRow className="opacity-50">
                    <TableCell colSpan={isOrgAdmin ? 7 : 6} className="text-center text-xs text-muted-foreground">
                      +{seatsAvailable - 3} more open seat{seatsAvailable - 3 > 1 ? "s" : ""} available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Remove-member confirmation ── */}
      <AlertDialog open={Boolean(memberToRemove)} onOpenChange={(v) => !v && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{memberToRemove?.profile?.display_name}</strong> will lose access to {organization.name} and all
              its resources. This can be undone by re-inviting them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
