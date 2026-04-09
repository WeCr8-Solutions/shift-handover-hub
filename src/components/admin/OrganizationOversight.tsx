import { useState, useEffect } from "react";
import { OrganizationWithStats, useAllOrganizations } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Loader2, Search, Briefcase, Crown, Plug, Gift, Trash2, Users, Building2, Wrench, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AdminComponentAccess } from "@/types/admin";
import { OrgDetailView } from "./OrgDetailView";

interface OrganizationOversightProps {
  isAdmin?: boolean;
  access?: AdminComponentAccess;
}

export function OrganizationOversight({ isAdmin, access }: OrganizationOversightProps) {
  const isPlatformAdmin = access?.isPlatformAdmin ?? isAdmin ?? false;
  const { organizations, loading, deleteOrganization } = useAllOrganizations();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [orgToDelete, setOrgToDelete] = useState<OrganizationWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [erpStatuses, setErpStatuses] = useState<Map<string, { status: string; vendor: string }>>(new Map());
  const [orgToGrant, setOrgToGrant] = useState<OrganizationWithStats | null>(null);
  const [grantDuration, setGrantDuration] = useState("30");
  const [isGranting, setIsGranting] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithStats | null>(null);

  useEffect(() => {
    const fetchErpStatuses = async () => {
      const { data } = await supabase
        .from("erp_connections_safe" as any)
        .select("organization_id, connection_status, erp_vendor");
      if (data) {
        const map = new Map<string, { status: string; vendor: string }>();
        (data as any[]).forEach((c: any) => map.set(c.organization_id, { status: c.connection_status, vendor: c.erp_vendor }));
        setErpStatuses(map);
      }
    };
    if (organizations.length > 0) fetchErpStatuses();
  }, [organizations]);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleDelete = async () => {
    if (!orgToDelete) return;
    setIsDeleting(true);
    const { error } = await deleteOrganization(orgToDelete.id, orgToDelete.name);
    setIsDeleting(false);
    setOrgToDelete(null);
    if (error) {
      toast({ title: "Failed to delete organization", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organization deleted", description: `${orgToDelete.name} has been removed.` });
      if (selectedOrg?.id === orgToDelete.id) setSelectedOrg(null);
    }
  };

  const handleGrantComplimentary = async () => {
    if (!orgToGrant) return;
    setIsGranting(true);
    const days = parseInt(grantDuration);
    const newTrialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("organizations")
      .update({ subscription_status: "complimentary", subscription_tier: "team", trial_ends_at: newTrialEnd })
      .eq("id", orgToGrant.id);
    setIsGranting(false);
    if (error) {
      toast({ title: "Failed to grant access", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Complimentary access granted", description: `${orgToGrant.name} now has free Team-tier access for ${days} days.` });
      setOrgToGrant(null);
    }
  };

  const getTierBadgeVariant = (tier: string | null) => {
    switch (tier) {
      case "enterprise": return "default";
      case "professional": return "secondary";
      case "starter": return "outline";
      default: return "outline";
    }
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

  // Detail view when an org is selected
  if (selectedOrg) {
    return (
      <>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <OrgDetailView
              org={selectedOrg}
              onBack={() => setSelectedOrg(null)}
              isPlatformAdmin={isPlatformAdmin}
              onDelete={setOrgToDelete}
              onGrant={(org) => { setOrgToGrant(org); setGrantDuration("30"); }}
              erpStatus={erpStatuses.get(selectedOrg.id) || null}
            />
          </CardContent>
        </Card>

        {/* Keep dialogs rendered */}
        <DeleteDialog orgToDelete={orgToDelete} setOrgToDelete={setOrgToDelete} handleDelete={handleDelete} isDeleting={isDeleting} />
        <GrantDialog orgToGrant={orgToGrant} setOrgToGrant={setOrgToGrant} grantDuration={grantDuration} setGrantDuration={setGrantDuration} handleGrantComplimentary={handleGrantComplimentary} isGranting={isGranting} />
      </>
    );
  }

  // List view
  return (
    <>
      <Card>
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Briefcase className="w-4 h-4 shrink-0" />
                Organization Oversight
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-sm">
                {organizations.length} org(s) · {organizations.reduce((sum, o) => sum + o.member_count, 0)} members · {organizations.reduce((sum, o) => sum + o.team_count, 0)} teams
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs sm:text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          {organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-semibold mb-1">No Organizations Yet</h3>
              <p className="text-xs text-muted-foreground">
                Organizations will appear here once users create them.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredOrgs.map((org) => {
                const erp = erpStatuses.get(org.id);
                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className="w-full text-left p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold truncate">{org.name}</p>
                          <Badge variant={getTierBadgeVariant(org.subscription_tier) as any} className="text-[9px] sm:text-[10px] px-1 py-0 shrink-0">
                            {org.subscription_tier || "Free"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{org.member_count}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{org.team_count}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Wrench className="w-2.5 h-2.5" />{org.station_count}</span>
                          {org.owner_name && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5 truncate"><Crown className="w-2.5 h-2.5" />{org.owner_name}</span>
                            </>
                          )}
                          {erp && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Plug className="w-2.5 h-2.5" />{erp.vendor}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog orgToDelete={orgToDelete} setOrgToDelete={setOrgToDelete} handleDelete={handleDelete} isDeleting={isDeleting} />
      <GrantDialog orgToGrant={orgToGrant} setOrgToGrant={setOrgToGrant} grantDuration={grantDuration} setGrantDuration={setGrantDuration} handleGrantComplimentary={handleGrantComplimentary} isGranting={isGranting} />
    </>
  );
}

// --- Extracted Dialog Components ---

function DeleteDialog({ orgToDelete, setOrgToDelete, handleDelete, isDeleting }: {
  orgToDelete: OrganizationWithStats | null;
  setOrgToDelete: (org: OrganizationWithStats | null) => void;
  handleDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm sm:text-base">Delete Organization?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm">
            This will permanently delete <strong>{orgToDelete?.name}</strong> and remove all{" "}
            {orgToDelete?.member_count} member(s), {orgToDelete?.team_count} team(s), and {orgToDelete?.station_count} station(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="text-xs sm:text-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            disabled={isDeleting}
          >
            {isDeleting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Deleting...</> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function GrantDialog({ orgToGrant, setOrgToGrant, grantDuration, setGrantDuration, handleGrantComplimentary, isGranting }: {
  orgToGrant: OrganizationWithStats | null;
  setOrgToGrant: (org: OrganizationWithStats | null) => void;
  grantDuration: string;
  setGrantDuration: (d: string) => void;
  handleGrantComplimentary: () => void;
  isGranting: boolean;
}) {
  return (
    <Dialog open={!!orgToGrant} onOpenChange={(open) => !open && setOrgToGrant(null)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Gift className="w-4 h-4 text-primary" />
            Grant Complimentary Access
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Grant free Team-tier access to <strong>{orgToGrant?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Duration</Label>
            <Select value={grantDuration} onValueChange={setGrantDuration}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
            <p>Current: <strong>{orgToGrant?.subscription_status || "none"}</strong> / <strong>{orgToGrant?.subscription_tier || "free"}</strong></p>
            <p>Will be: <strong className="text-primary">Team (Complimentary)</strong> for <strong>{grantDuration} days</strong></p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => setOrgToGrant(null)} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={handleGrantComplimentary} disabled={isGranting} className="gap-1.5 text-xs">
            {isGranting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
            {isGranting ? "Granting..." : "Grant Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
