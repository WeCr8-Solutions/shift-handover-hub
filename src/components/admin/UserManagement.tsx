import { useState } from "react";
import { UserWithRole, useAllUsers } from "@/hooks/useAdminData";
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
import { Loader2, MoreHorizontal, Search, Shield, UserCog, Eye, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-700 border-red-200", icon: <Shield className="w-3 h-3" /> },
  supervisor: { label: "Supervisor", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: <UserCog className="w-3 h-3" /> },
  operator: { label: "Operator", color: "bg-green-500/10 text-green-700 border-green-200", icon: <UsersIcon className="w-3 h-3" /> },
  viewer: { label: "Viewer", color: "bg-gray-500/10 text-gray-700 border-gray-200", icon: <Eye className="w-3 h-3" /> },
};

interface UserManagementProps {
  isAdmin: boolean;
}

export function UserManagement({ isAdmin }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const { users, loading, updateUserRole } = useAllUsers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              {users.length} registered user(s) • {isAdmin ? "Full access" : "View only"}
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              {isAdmin && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
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
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className={`gap-1 ${ROLE_CONFIG[role].color}`}
                      >
                        {ROLE_CONFIG[role].icon}
                        {ROLE_CONFIG[role].label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Roles</DropdownMenuLabel>
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
                                className="gap-2"
                              >
                                {ROLE_CONFIG[role].icon}
                                {hasRole ? `Remove ${ROLE_CONFIG[role].label}` : `Add ${ROLE_CONFIG[role].label}`}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
