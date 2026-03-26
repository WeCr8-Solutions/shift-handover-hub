import { useState, useEffect } from "react";
import { OrganizationWithStats, useAllOrganizations } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Loader2, Search, Users, Building2, Wrench, Trash2, Briefcase, Crown, Mail, Plug, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AdminComponentAccess } from "@/types/admin";

interface OrganizationOversightProps {
  isAdmin?: boolean;
  access?: AdminComponentAccess;
}

export function OrganizationOversight({ isAdmin, access }: OrganizationOversightProps) {
  // Derive from access if provided, fall back to legacy isAdmin prop
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

  // Fetch ERP connection status per org
  useEffect(() => {
    const fetchErpStatuses = async () => {
      const { data } = await supabase
        .from("erp_connections")
        .select("organization_id, connection_status, erp_vendor");
      if (data) {
        const map = new Map<string, { status: string; vendor: string }>();
        data.forEach((c) => map.set(c.organization_id, { status: c.connection_status, vendor: c.erp_vendor }));
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
      toast({
        title: "Failed to delete organization",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Organization deleted",
        description: `${orgToDelete.name} has been removed.`,
      });
    }
  };

  const handleGrantComplimentary = async () => {
    if (!orgToGrant) return;

    setIsGranting(true);
    const days = parseInt(grantDuration);
    const newTrialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("organizations")
      .update({
        subscription_status: "complimentary",
        subscription_tier: "team",
        trial_ends_at: newTrialEnd,
      })
      .eq("id", orgToGrant.id);

    setIsGranting(false);

    if (error) {
      toast({
        title: "Failed to grant access",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Complimentary access granted",
        description: `${orgToGrant.name} now has free Team-tier access for ${days} days.`,
      });
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

  return (
    <>
      <Card>
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Organization Oversight
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {organizations.length} org(s) • {organizations.reduce((sum, o) => sum + o.member_count, 0)} members • {organizations.reduce((sum, o) => sum + o.team_count, 0)} teams
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
              <p className="text-sm text-muted-foreground">
                Organizations will appear here once users create them.
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={filteredOrgs.map(o => o.id)} className="space-y-3">
              {filteredOrgs.map((org) => (
                <AccordionItem key={org.id} value={org.id} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-3 py-3 sm:px-4 sm:py-4 bg-muted/30">
                    <div className="flex items-center gap-2 sm:gap-3 w-full pr-2 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm sm:text-base truncate">{org.name}</p>
                          <Badge variant={getTierBadgeVariant(org.subscription_tier)} className="text-[10px] px-1.5 py-0">
                            {org.subscription_tier || "Free"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <span>{org.member_count} users</span>
                          <span>•</span>
                          <span>{org.team_count} teams</span>
                          <span>•</span>
                          <span>{org.station_count} stations</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                    {/* Organization Owner Card - Primary Account Holder */}
                    <div className="mb-3 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="default" className="gap-1 text-[10px] px-1.5 py-0">
                              <Crown className="w-2.5 h-2.5" />
                              Owner
                            </Badge>
                          </div>
                          {org.owner_name ? (
                            <>
                              <p className="font-semibold text-sm truncate">{org.owner_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {org.owner_email}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No owner assigned</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Subscription & Billing Info */}
                      <div className="mt-3 pt-2 border-t border-primary/20 grid grid-cols-3 gap-2">
                        <div className="text-center p-1.5 rounded bg-background/50">
                          <p className="text-sm sm:text-lg font-bold text-primary">{org.subscription_tier || "Free"}</p>
                          <p className="text-[10px] text-muted-foreground">Plan</p>
                        </div>
                        <div className="text-center p-1.5 rounded bg-background/50">
                          <p className="text-sm sm:text-lg font-bold">{org.subscription_status || "N/A"}</p>
                          <p className="text-[10px] text-muted-foreground">Status</p>
                        </div>
                        <div className="text-center p-1.5 rounded bg-background/50">
                          <p className="text-sm sm:text-lg font-bold">{new Date(org.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground">Created</p>
                        </div>
                      </div>
                    </div>

                    {/* Organization Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-lg sm:text-2xl font-bold">{org.member_count}</p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Members</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-lg sm:text-2xl font-bold">{org.team_count}</p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Teams</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-lg sm:text-2xl font-bold">{org.station_count}</p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Stations</p>
                      </div>
                    </div>

                    {/* ERP Connection Status */}
                    {(() => {
                      const erp = erpStatuses.get(org.id);
                      return (
                        <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Plug className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">ERP Connection</span>
                            </div>
                            {erp ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{erp.vendor}</Badge>
                                <Badge
                                  variant={erp.status === "connected" ? "secondary" : erp.status === "error" ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {erp.status}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not configured</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}


                    {isPlatformAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setOrgToGrant(org);
                            setGrantDuration("30");
                          }}
                        >
                          <Gift className="w-4 h-4" />
                          Grant Complimentary
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setOrgToDelete(org)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Organization
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{orgToDelete?.name}</strong> and remove all{" "}
              {orgToDelete?.member_count} member(s), {orgToDelete?.team_count} team(s), and {orgToDelete?.station_count} station(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Grant Complimentary Access Dialog */}
      <Dialog open={!!orgToGrant} onOpenChange={(open) => !open && setOrgToGrant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Grant Complimentary Access
            </DialogTitle>
            <DialogDescription>
              Grant free Team-tier access to <strong>{orgToGrant?.name}</strong>. This bypasses billing and sets the subscription to complimentary status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger>
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
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p>Current status: <strong>{orgToGrant?.subscription_status || "none"}</strong></p>
              <p>Current tier: <strong>{orgToGrant?.subscription_tier || "free"}</strong></p>
              <p className="mt-1">Will be set to: <strong className="text-primary">Team (Complimentary)</strong> for <strong>{grantDuration} days</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgToGrant(null)}>Cancel</Button>
            <Button onClick={handleGrantComplimentary} disabled={isGranting} className="gap-2">
              {isGranting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              {isGranting ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
