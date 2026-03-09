import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationInvites, OrganizationInvite } from "@/hooks/useOrganizationInvites";
import { useOrgContext } from "@/contexts/OrgContext";
import { useTeams } from "@/hooks/useTeams";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  History,
  User,
  Mail,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

interface InviteRedemption {
  id: string;
  invite_id: string;
  user_id: string;
  redeemed_at: string;
  user?: {
    display_name: string;
    email: string;
  };
  invite?: {
    invite_code: string;
    org_role: string;
    app_role: string | null;
    team?: {
      name: string;
    };
  };
}

interface InviteCodeGeneratorProps {
  defaultTeamId?: string;
}

export function InviteCodeGenerator({ defaultTeamId }: InviteCodeGeneratorProps = {}) {
  const { organization } = useOrgContext();
  const { invites, loading, createInvite, deactivateInvite, deleteInvite } = useOrganizationInvites(
    organization?.id || null
  );
  const { teams } = useTeams();
  const { toast } = useToast();
  const { limits, plan } = useEntitlements();

  const [activeTab, setActiveTab] = useState("invites");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<OrganizationInvite | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Seat tracking
  const [memberCount, setMemberCount] = useState(0);
  const seatLimit = limits?.users ?? 5;
  const seatsUsedPercent = seatLimit > 0 ? (memberCount / seatLimit) * 100 : 0;
  const seatsRemaining = Math.max(0, seatLimit - memberCount);
  const isSeatsFull = memberCount >= seatLimit;
  const isSeatsWarning = seatsUsedPercent >= 80 && !isSeatsFull;

  // Fetch member count
  useEffect(() => {
    if (!organization?.id) return;
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .then(({ count }) => setMemberCount(count ?? 0));
  }, [organization?.id]);

  // Redemption history
  const [redemptions, setRedemptions] = useState<InviteRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Form state
  const [teamId, setTeamId] = useState<string>(defaultTeamId || "none");
  const [orgRole, setOrgRole] = useState<"admin" | "member">("member");
  const [appRole, setAppRole] = useState<string>("none");
  const [expiresInDays, setExpiresInDays] = useState<string>("15");
  const [maxUses, setMaxUses] = useState<string>("");

  // Update teamId when defaultTeamId changes
  useEffect(() => {
    if (defaultTeamId) {
      setTeamId(defaultTeamId);
    }
  }, [defaultTeamId]);

  const fetchRedemptions = useCallback(async () => {
    if (!organization) return;

    setLoadingRedemptions(true);
    const { data, error } = await supabase
      .from("invite_redemptions")
      .select(`
        id,
        invite_id,
        user_id,
        redeemed_at,
        organization_invites!inner(
          invite_code,
          org_role,
          app_role,
          organization_id,
          teams(name)
        )
      `)
      .eq("organization_invites.organization_id", organization.id)
      .order("redeemed_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      const formatted: InviteRedemption[] = data.map((r: any) => ({
        id: r.id,
        invite_id: r.invite_id,
        user_id: r.user_id,
        redeemed_at: r.redeemed_at,
        user: profileMap.get(r.user_id) ? {
          display_name: (profileMap.get(r.user_id) as any).display_name || "Unknown",
          email: "",
        } : { display_name: "Unknown User", email: "" },
        invite: {
          invite_code: r.organization_invites.invite_code,
          org_role: r.organization_invites.org_role,
          app_role: r.organization_invites.app_role,
          team: r.organization_invites.teams ? { name: r.organization_invites.teams.name } : undefined,
        },
      }));
      setRedemptions(formatted);
    }
    setLoadingRedemptions(false);
  }, [organization]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRedemptions();
    }
  }, [activeTab, fetchRedemptions]);

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
      setTeamId(defaultTeamId || "none");
      setOrgRole("member");
      setAppRole("none");
      setExpiresInDays("15");
      setMaxUses("");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/auth?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Invite link copied to clipboard." });
  };

  const handleShowQR = (invite: OrganizationInvite) => {
    setSelectedInvite(invite);
    setShowQRDialog(true);
  };

  const handleDeactivate = async (inviteId: string) => {
    const { error } = await deactivateInvite(inviteId);
    if (error) {
      toast({ title: "Failed to deactivate", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite deactivated" });
    }
  };

  const handleDelete = async (inviteId: string) => {
    const { error } = await deleteInvite(inviteId);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
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
              <Button className="gap-2" disabled={isSeatsFull}>
                <Plus className="w-4 h-4" />
                Create Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invite Code</DialogTitle>
                <DialogDescription>
                  Generate a new invite code for {organization.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Seat info inside dialog */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Seats
                    </span>
                    <span className="font-medium">{memberCount} / {seatLimit} used</span>
                  </div>
                  <Progress value={Math.min(seatsUsedPercent, 100)} className="h-1.5" />
                  {seatsRemaining <= 3 && seatsRemaining > 0 && (
                    <p className="text-xs text-amber-600">Only {seatsRemaining} seat{seatsRemaining !== 1 ? "s" : ""} remaining</p>
                  )}
                </div>

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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>App Role (optional)</Label>
                    <Select value={appRole} onValueChange={setAppRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default (Operator)</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expires In (days)</Label>
                    <Input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="15" min="1" max="90" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses (optional)</Label>
                    <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" min="1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateInvite} disabled={isCreating}>
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
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
        {/* Seat availability banner */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Seat Availability
            </span>
            <span className="font-medium">{memberCount} / {seatLimit} seats used</span>
          </div>
          <Progress value={Math.min(seatsUsedPercent, 100)} className="h-2" />
          
          {isSeatsFull && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  All seats are filled. New invites are disabled.
                </span>
                <Button variant="outline" size="sm" className="gap-1 ml-2 shrink-0" onClick={() => window.location.hash = "#billing"}>
                  <CreditCard className="w-3 h-3" />
                  Add Seats
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isSeatsWarning && (
            <Alert className="py-2 border-amber-500/30 bg-amber-500/5">
              <AlertDescription className="flex items-center gap-1.5 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                {seatsRemaining} seat{seatsRemaining !== 1 ? "s" : ""} remaining — consider adding more in Billing Settings.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="invites" className="gap-2">
              <QrCode className="w-4 h-4" />
              Active Invites
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Redemption History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invites">
            {loading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No invite codes yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden sm:table-cell">For Email</TableHead>
                    <TableHead className="hidden md:table-cell">Team</TableHead>
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
                        <TableCell className="hidden sm:table-cell">
                          {invite.invited_email ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]" title={invite.invited_email}>
                                {invite.invited_email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Anyone</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {invite.team?.name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">Org: {invite.org_role}</Badge>
                            {invite.app_role && (
                              <Badge variant="secondary" className="text-xs">{invite.app_role}</Badge>
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
                              <CheckCircle className="w-3 h-3" />Active
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShowQR(invite)} title="Show QR Code">
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyLink(invite.invite_code)} title="Copy Link">
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyCode(invite.invite_code)} title="Copy Code">
                              <Copy className="w-4 h-4" />
                            </Button>
                            {invite.is_active && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeactivate(invite.id)} title="Deactivate">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(invite.id)} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loadingRedemptions ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No redemptions yet.</p>
                <p className="text-sm">When members join using invite codes, they'll appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Invite Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Team</TableHead>
                    <TableHead className="hidden md:table-cell">Roles Assigned</TableHead>
                    <TableHead>Redeemed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            {redemption.user?.display_name || "Unknown User"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {redemption.invite?.invite_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {redemption.invite?.team?.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">Org: {redemption.invite?.org_role}</Badge>
                          {redemption.invite?.app_role && (
                            <Badge variant="secondary" className="text-xs">{redemption.invite.app_role}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(redemption.redeemed_at).toLocaleDateString()}{" "}
                          {new Date(redemption.redeemed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
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
                <Badge variant="secondary">Auto-joins: {selectedInvite.team.name}</Badge>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="gap-2" onClick={() => selectedInvite && handleCopyCode(selectedInvite.invite_code)}>
              <Copy className="w-4 h-4" />Copy Code
            </Button>
            <Button className="gap-2" onClick={() => selectedInvite && handleCopyLink(selectedInvite.invite_code)}>
              <Share2 className="w-4 h-4" />Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
