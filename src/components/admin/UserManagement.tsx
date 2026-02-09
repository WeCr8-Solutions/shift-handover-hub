import { useState } from "react";
import { UserWithRole, OrganizationWithUsers, useAllUsers } from "@/hooks/useAdminData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MoreHorizontal, Search, Shield, UserCog, Eye, Users as UsersIcon, Building2, ChevronDown, Crown, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_CONFIG: Record<AppRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  admin: { label: "Admin", variant: "destructive", icon: <Shield className="w-3 h-3" /> },
  developer: { label: "Developer", variant: "default", icon: <Shield className="w-3 h-3" /> },
  supervisor: { label: "Supervisor", variant: "secondary", icon: <UserCog className="w-3 h-3" /> },
  operator: { label: "Operator", variant: "outline", icon: <UsersIcon className="w-3 h-3" /> },
  viewer: { label: "Viewer", variant: "outline", icon: <Eye className="w-3 h-3" /> },
};

const ORG_ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  owner: { label: "Owner", icon: <Crown className="w-3 h-3" /> },
  admin: { label: "Admin", icon: <Shield className="w-3 h-3" /> },
  member: { label: "Member", icon: <User className="w-3 h-3" /> },
};

interface UserManagementProps {
  isAdmin: boolean;
}

type ViewMode = "grouped" | "flat";

export function UserManagement({ isAdmin }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const { users, organizations, loading, updateUserRole } = useAllUsers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");

  // Filter users based on search and org
  const filterUsers = (userList: UserWithRole[]) => {
    return userList.filter((u) => {
      const matchesSearch = 
        u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOrg = selectedOrg === "all" || 
        (selectedOrg === "no-org" && !u.organization) ||
        u.organization?.id === selectedOrg;
      
      return matchesSearch && matchesOrg;
    });
  };

  const filteredUsers = filterUsers(users);

  const handleRoleChange = async (userId: string, role: AppRole, hasRole: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can modify user roles.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUser(userId);
    const { error } = await updateUserRole(userId, role, hasRole ? "remove" : "add");
    setUpdatingUser(null);

    if (error) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: hasRole ? "Role removed" : "Role added",
        description: `Successfully ${hasRole ? "removed" : "added"} ${role} role.`,
      });
    }
  };

  const renderUserRow = (user: UserWithRole, showOrg: boolean = false) => (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.display_name}</p>
            {user.user_id === currentUser?.id && (
              <span className="text-xs text-muted-foreground">(You)</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
      {showOrg && (
        <TableCell>
          {user.organization ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Building2 className="w-3 h-3" />
                {user.organization.name}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                {ORG_ROLE_CONFIG[user.organization.role]?.icon}
                {ORG_ROLE_CONFIG[user.organization.role]?.label || user.organization.role}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-2">
          {user.organization && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {ORG_ROLE_CONFIG[user.organization.role]?.icon}
              {ORG_ROLE_CONFIG[user.organization.role]?.label}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <Badge
                key={role}
                variant={ROLE_CONFIG[role].variant}
                className="gap-1"
              >
                {ROLE_CONFIG[role].icon}
                {ROLE_CONFIG[role].label}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No roles</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      {isAdmin && (
        <TableCell>
          {updatingUser === user.user_id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                <DropdownMenuLabel>Manage Platform Roles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(ROLE_CONFIG) as AppRole[]).map((role) => {
                  const hasRole = user.roles.includes(role);
                  const isSelf = user.user_id === currentUser?.id;
                  const isRemovingOwnAdmin = isSelf && role === "admin" && hasRole;
                  
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleChange(user.user_id, role, hasRole)}
                      disabled={isRemovingOwnAdmin}
                      className="gap-2 cursor-pointer"
                    >
                      {ROLE_CONFIG[role].icon}
                      {hasRole ? `Remove ${ROLE_CONFIG[role].label}` : `Add ${ROLE_CONFIG[role].label}`}
                      {hasRole && <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      )}
    </TableRow>
  );

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
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                {users.length} users across {organizations.length} organization(s) • {isAdmin ? "Full access" : "View only"}
              </CardDescription>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by org" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-50">
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="no-org">No Organization</SelectItem>
                {organizations.filter(o => o.id !== "no-org").map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} ({org.users.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-50">
                <SelectItem value="grouped">Grouped View</SelectItem>
                <SelectItem value="flat">Flat View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === "grouped" ? (
          <Accordion type="multiple" defaultValue={organizations.map(o => o.id)} className="space-y-2">
            {organizations
              .filter(org => selectedOrg === "all" || org.id === selectedOrg || (selectedOrg === "no-org" && org.id === "no-org"))
              .map((org) => {
                const orgUsers = filterUsers(org.users);
                if (orgUsers.length === 0) return null;
                
                return (
                  <AccordionItem key={org.id} value={org.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{org.name}</span>
                            {org.subscription_tier && (
                              <Badge variant="secondary" className="text-xs">
                                {org.subscription_tier}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {orgUsers.length} user(s)
                            {org.id === "no-org" && " • Not assigned to any organization"}
                          </div>
                        </div>
                        <Badge variant="outline" className="mr-4">
                          {orgUsers.length} users
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="border rounded-lg mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Org Role</TableHead>
                              <TableHead>Platform Roles</TableHead>
                              <TableHead>Joined</TableHead>
                              {isAdmin && <TableHead className="w-12"></TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orgUsers.map((user) => renderUserRow(user, false))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Org Role</TableHead>
                  <TableHead>Platform Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => renderUserRow(user, true))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No users found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
