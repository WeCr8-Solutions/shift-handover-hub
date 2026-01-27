import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useOrganizationInvites, OrganizationInvite } from "@/hooks/useOrganizationInvites";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useTeams } from "@/hooks/useTeams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  Plus,
  Copy,
  Trash2,
  Loader2,
  XCircle,
  CheckCircle,
  Users,
  Clock,
  Share2,
} from "lucide-react";

export function InviteCodeGenerator() {
  const { organization } = useUserOrganization();
  const { invites, loading, createInvite, deactivateInvite, deleteInvite } = useOrganizationInvites(
    organization?.id || null
  );
  const { teams } = useTeams();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<OrganizationInvite | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [teamId, setTeamId] = useState<string>("none");
  const [orgRole, setOrgRole] = useState<"admin" | "member">("member");
  const [appRole, setAppRole] = useState<string>("none");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");
  const [maxUses, setMaxUses] = useState<string>("");

  const handleCreateInvite = async () => {
    setIsCreating(true);
    const { data, error } = await createInvite({
      teamId: teamId !== "none" ? teamId : undefined,
      orgRole,
      appRole: appRole !== "none" ? (appRole as "supervisor" | "operator") : null,
      expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      maxUses: maxUses ? parseInt(maxUses) : null,
    });
    setIsCreating(false);

    if (error) {
      toast({
        title: "Failed to create invite",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invite created!",
        description: `Code: ${data?.invite_code}`,
      });
      setShowCreateDialog(false);
      if (data) {
        setSelectedInvite(data as OrganizationInvite);
        setShowQRDialog(true);
      }
      // Reset form
      setTeamId("none");
      setOrgRole("member");
      setAppRole("none");
      setExpiresInDays("7");
      setMaxUses("");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard.",
    });
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/auth?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  const handleShowQR = (invite: OrganizationInvite) => {
    setSelectedInvite(invite);
    setShowQRDialog(true);
  };

  const handleDeactivate = async (inviteId: string) => {
    const { error } = await deactivateInvite(inviteId);
    if (error) {
      toast({
        title: "Failed to deactivate",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Invite deactivated" });
    }
  };

  const handleDelete = async (inviteId: string) => {
    const { error } = await deleteInvite(inviteId);
    if (error) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Invite deleted" });
    }
  };

  const getInviteLink = (code: string) => `${window.location.origin}/auth?invite=${code}`;

  if (!organization) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Invite Codes
            </CardTitle>
            <CardDescription>
              Generate QR codes and invite links for new members
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Code</DialogTitle>
                <DialogDescription>
                  Generate a new invite code for {organization.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign to Team (optional)</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team assignment</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organization Role</Label>
                    <Select value={orgRole} onValueChange={(v) => setOrgRole(v as "admin" | "member")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>App Role (optional)</Label>
                    <Select value={appRole} onValueChange={setAppRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default (Operator)</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expires In (days)</Label>
                    <Input
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      placeholder="7"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Uses (optional)</Label>
                    <Input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Invite"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No invite codes yet. Create one to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
                const isMaxedOut = invite.max_uses && invite.uses_count >= invite.max_uses;
                const isValid = invite.is_active && !isExpired && !isMaxedOut;

                return (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                        {invite.invite_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {invite.team?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          Org: {invite.org_role}
                        </Badge>
                        {invite.app_role && (
                          <Badge variant="secondary" className="text-xs">
                            {invite.app_role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-3 h-3" />
                        {invite.uses_count}
                        {invite.max_uses && `/${invite.max_uses}`}
                      </div>
                      {invite.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isValid ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          {isExpired ? "Expired" : isMaxedOut ? "Maxed" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleShowQR(invite)}
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyLink(invite.invite_code)}
                          title="Copy Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(invite.invite_code)}
                          title="Copy Code"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {invite.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeactivate(invite.id)}
                            title="Deactivate"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(invite.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Invite QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code or use the invite code to join {organization.name}
            </DialogDescription>
          </DialogHeader>
          {selectedInvite && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={getInviteLink(selectedInvite.invite_code)}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
                <code className="text-2xl font-mono font-bold tracking-widest">
                  {selectedInvite.invite_code}
                </code>
              </div>
              {selectedInvite.team?.name && (
                <Badge variant="secondary">
                  Auto-joins: {selectedInvite.team.name}
                </Badge>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => selectedInvite && handleCopyCode(selectedInvite.invite_code)}
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </Button>
            <Button
              className="gap-2"
              onClick={() => selectedInvite && handleCopyLink(selectedInvite.invite_code)}
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
