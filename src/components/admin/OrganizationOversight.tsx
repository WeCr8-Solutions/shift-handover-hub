import { useState } from "react";
import { OrganizationWithStats, useAllOrganizations } from "@/hooks/useAdminData";
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
import { Loader2, Search, Users, Building2, Wrench, Trash2, Briefcase, Crown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrganizationOversightProps {
  isAdmin: boolean;
}

export function OrganizationOversight({ isAdmin }: OrganizationOversightProps) {
  const { organizations, loading, deleteOrganization } = useAllOrganizations();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [orgToDelete, setOrgToDelete] = useState<OrganizationWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Organization Oversight
              </CardTitle>
              <CardDescription>
                {organizations.length} organization(s) • {organizations.reduce((sum, o) => sum + o.member_count, 0)} total members • {organizations.reduce((sum, o) => sum + o.team_count, 0)} teams
              </CardDescription>
            </div>
            <div className="relative w-64">
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
            <Accordion type="multiple" className="space-y-2">
              {filteredOrgs.map((org) => (
                <AccordionItem key={org.id} value={org.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{org.name}</p>
                          <p className="text-sm text-muted-foreground">@{org.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getTierBadgeVariant(org.subscription_tier)}>
                          {org.subscription_tier || "Free"}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="w-3 h-3" />
                          {org.member_count}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="w-3 h-3" />
                          {org.team_count}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Wrench className="w-3 h-3" />
                          {org.station_count}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Owner Info */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Crown className="w-4 h-4 text-primary" />
                          Organization Owner
                        </h4>
                        {org.owner_name ? (
                          <div className="space-y-1">
                            <p className="font-medium">{org.owner_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {org.owner_email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No owner assigned</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="text-sm font-medium mb-3">Organization Stats</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-2xl font-bold">{org.member_count}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{org.team_count}</p>
                            <p className="text-xs text-muted-foreground">Teams</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{org.station_count}</p>
                            <p className="text-xs text-muted-foreground">Stations</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(org.created_at).toLocaleDateString()}
                        {org.subscription_status && (
                          <span className="ml-4">
                            Status: <Badge variant="outline" className="ml-1">{org.subscription_status}</Badge>
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setOrgToDelete(org)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Organization
                        </Button>
                      )}
                    </div>
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
    </>
  );
}
