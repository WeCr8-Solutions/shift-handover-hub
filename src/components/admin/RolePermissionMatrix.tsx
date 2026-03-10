import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield, Code, UserCheck, Wrench, Eye, Building2, Users } from "lucide-react";
import { permissionMatrix } from "@/hooks/useRoleArchitecture";

const roleHeaders = [
  { key: "admin", label: "Admin", icon: Shield, color: "text-role-admin" },
  { key: "developer", label: "Developer", icon: Code, color: "text-role-developer" },
  { key: "supervisor", label: "Supervisor", icon: UserCheck, color: "text-role-supervisor" },
  { key: "operator", label: "Operator", icon: Wrench, color: "text-role-operator" },
  { key: "viewer", label: "Viewer", icon: Eye, color: "text-role-viewer" },
  { key: "orgOwner", label: "Org Owner", icon: Building2, color: "text-role-org-owner" },
  { key: "orgAdmin", label: "Org Admin", icon: Users, color: "text-role-org-admin" },
];

export function RolePermissionMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Permission Matrix
        </CardTitle>
        <CardDescription>
          Complete action-to-role mapping showing what each role can do
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Action</TableHead>
                {roleHeaders.map((header) => {
                  const Icon = header.icon;
                  return (
                    <TableHead key={header.key} className="text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Icon className={`w-4 h-4 ${header.color}`} />
                        <span className="text-xs">{header.label}</span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map((permission) => (
                <TableRow key={permission.action}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm">
                    {permission.action}
                  </TableCell>
                  {roleHeaders.map((header) => {
                    const hasPermission = permission[header.key as keyof typeof permission];
                    return (
                      <TableCell key={header.key} className="text-center">
                        {hasPermission ? (
                          <Check className="w-4 h-4 text-status-ok mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">Platform</Badge>
            <span className="text-muted-foreground">Admin, Developer (user_roles)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">App</Badge>
            <span className="text-muted-foreground">Supervisor, Operator, Viewer (user_roles)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">Org</Badge>
            <span className="text-muted-foreground">Owner, Admin (organization_members)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
