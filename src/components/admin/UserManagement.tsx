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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, MoreHorizontal, Search, Shield, UserCog, Eye, Users as UsersIcon, Building2, Crown, User, ShieldCheck, ShieldAlert, Lock, Unlock, Info } from "lucide-react";
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

// RLS Access Level computation
interface RLSAccessLevel {
  level: "platform_admin" | "org_owner" | "org_admin" | "supervisor" | "operator" | "viewer" | "no_access";
  label: string;
  description: string;
  capabilities: string[];
  icon: React.ReactNode;
  variant: "destructive" | "default" | "secondary" | "outline";
}

function computeRLSAccessLevel(user: UserWithRole): RLSAccessLevel {
  const hasPlatformAdmin = user.roles.includes("admin");
  const hasDeveloper = user.roles.includes("developer");
  const hasSupervisor = user.roles.includes("supervisor");
  const orgRole = user.organization?.role;

  // Platform Admin - highest level
  if (hasPlatformAdmin) {
    return {
      level: "platform_admin",
      label: "Platform Admin",
      description: "Full platform access via is_dev_or_admin(). Can bypass most RLS policies.",
      capabilities: [
        "Access all organizations' data",
        "Manage all users and roles",
        "View RLS Health checks",
        "Access Dev Settings",
        "Delete any organization",
      ],
      icon: <ShieldAlert className="w-3 h-3" />,
      variant: "destructive",
    };
  }

  // Developer - testing access
  if (hasDeveloper) {
    return {
      level: "platform_admin",
      label: "Developer",
      description: "Platform developer with testing access via is_dev_or_admin().",
      capabilities: [
        "Access Dev Tools & RLS Health",
        "View system-wide analytics",
        "Debug user issues",
        "Access activity logs",
      ],
      icon: <ShieldCheck className="w-3 h-3" />,
      variant: "default",
    };
  }

  // Org Owner - full org access
  if (orgRole === "owner") {
    return {
      level: "org_owner",
      label: "Org Owner",
      description: "Full organization access via is_org_admin(). Can manage all org data.",
      capabilities: [
        "Full CRUD on org data",
        "Manage org members & teams",
        "Assign supervisor/operator roles",
        "View org billing & subscription",
        "Delete teams and stations",
      ],
      icon: <Crown className="w-3 h-3" />,
      variant: "default",
    };
  }

  // Org Admin - org management
  if (orgRole === "admin") {
    return {
      level: "org_admin",
      label: "Org Admin",
      description: "Organization admin access via is_org_admin(). Can manage most org data.",
      capabilities: [
        "Manage org members",
        "Create/edit teams & stations",
        "Assign supervisor/operator roles",
        "View org analytics",
      ],
      icon: <Shield className="w-3 h-3" />,
      variant: "secondary",
    };
  }

  // Supervisor - team/org level
  if (hasSupervisor && user.organization) {
    return {
      level: "supervisor",
      label: "Supervisor",
      description: "Supervisor access via is_supervisor_in_org(). Can manage team data.",
      capabilities: [
        "View org-wide data (read)",
        "Manage team members",
        "Review handoffs & performance",
        "Access activity logs",
      ],
      icon: <UserCog className="w-3 h-3" />,
      variant: "secondary",
    };
  }

  // Operator - basic access
  if (user.organization && (orgRole === "member" || user.roles.includes("operator"))) {
    return {
      level: "operator",
      label: "Operator",
      description: "Basic org member access via is_org_member(). Limited to own data.",
      capabilities: [
        "View own profile & teams",
        "Submit handoffs",
        "View assigned stations",
        "Report issues",
      ],
      icon: <Unlock className="w-3 h-3" />,
      variant: "outline",
    };
  }

  // Viewer - read only
  if (user.roles.includes("viewer")) {
    return {
      level: "viewer",
      label: "Viewer",
      description: "Read-only access. Cannot modify any data.",
      capabilities: [
        "View assigned data only",
        "No write permissions",
      ],
      icon: <Eye className="w-3 h-3" />,
      variant: "outline",
    };
  }

  // No access
  return {
    level: "no_access",
    label: "No Org Access",
    description: "User is not a member of any organization. Most RLS policies will deny access.",
    capabilities: [
      "Can view own profile",
      "Cannot access org data",
      "Needs org invite to access features",
    ],
    icon: <Lock className="w-3 h-3" />,
    variant: "outline",
  };
}

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

  const renderAccessLevelBadge = (user: UserWithRole) => {
    const access = computeRLSAccessLevel(user);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={access.variant} className="gap-1 cursor-help">
              {access.icon}
              {access.label}
              <Info className="w-3 h-3 ml-1 opacity-50" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-3">
            <div className="space-y-2">
              <p className="font-medium text-sm">{access.label} Access</p>
              <p className="text-xs text-muted-foreground">{access.description}</p>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium mb-1">RLS Capabilities:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {access.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
      )}
      <TableCell>
        {renderAccessLevelBadge(user)}
      </TableCell>
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
                {users.length} users across {organizations.length} organization(s) • Hover on RLS Access for permission details
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
                      <div className="border rounded-lg mt-2 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  RLS Access
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Computed access level based on platform roles + org membership</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableHead>
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
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      RLS Access
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Computed access level based on platform roles + org membership</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
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
