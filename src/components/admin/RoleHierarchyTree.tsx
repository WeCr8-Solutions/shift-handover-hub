import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Code, 
  Building2, 
  Users, 
  Eye,
  Wrench,
  UserCheck,
  ChevronRight,
  GitBranch,
  Lock,
  Database,
  Zap,
  Table as TableIcon
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { roleDefinitions, RoleDefinition } from "@/hooks/useRoleArchitecture";
import { RolePermissionMatrix } from "./RolePermissionMatrix";
import { DatabaseFunctionsReference } from "./DatabaseFunctionsReference";
import { EntitlementsReference } from "./EntitlementsReference";

const scopeConfig = {
  platform: { badge: "destructive" as const, color: "bg-role-admin", description: "Global access via user_roles" },
  organization: { badge: "default" as const, color: "bg-role-org-owner", description: "Scoped via organization_members" },
  team: { badge: "secondary" as const, color: "bg-status-waiting", description: "Scoped via team_members" },
  app: { badge: "outline" as const, color: "bg-role-operator", description: "Capability role in user_roles" },
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="w-4 h-4" />,
  developer: <Code className="w-4 h-4" />,
  supervisor: <UserCheck className="w-4 h-4" />,
  operator: <Wrench className="w-4 h-4" />,
  viewer: <Eye className="w-4 h-4" />,
  org_owner: <Building2 className="w-4 h-4" />,
  org_admin: <Users className="w-4 h-4" />,
  org_member: <Users className="w-4 h-4" />,
  team_owner: <Users className="w-4 h-4" />,
  team_admin: <Users className="w-4 h-4" />,
  team_member: <Users className="w-4 h-4" />,
};

function RoleCard({ role }: { role: RoleDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = scopeConfig[role.scope];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${config.color} text-primary-foreground flex items-center justify-center shrink-0`}>
              {roleIcons[role.id] || <Users className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{role.name}</span>
                <Badge variant={config.badge} className="text-xs">{role.scope}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
              <code className="text-[10px] text-muted-foreground font-mono mt-1 block">
                {role.table}.{role.column}
              </code>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-11 space-y-3 pb-3 border-b border-dashed">
          {/* Capabilities */}
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
              <Lock className="w-3 h-3" />
              Capabilities ({role.capabilities.length})
            </div>
            <ul className="text-xs space-y-0.5">
              {role.capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="w-1 h-1 rounded-full bg-status-ok shrink-0 mt-1.5" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          {/* Restrictions */}
          {role.restrictions.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                <Lock className="w-3 h-3" />
                Restrictions
              </div>
              <ul className="text-xs space-y-0.5">
                {role.restrictions.map((res, i) => (
                  <li key={i} className="flex items-start gap-1 text-warning">
                    <span className="w-1 h-1 rounded-full bg-warning shrink-0 mt-1.5" />
                    {res}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helper Functions */}
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
              <Code className="w-3 h-3" />
              Helper Functions
            </div>
            <div className="flex flex-wrap gap-1">
              {role.helperFunctions.map((func, i) => (
                <code key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono">
                  {func}
                </code>
              ))}
            </div>
          </div>

          {/* RLS Access */}
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
              <Database className="w-3 h-3" />
              RLS Table Access
            </div>
            <div className="grid grid-cols-1 gap-1">
              {role.rlsAccess.map((access, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono min-w-[140px]">
                    {access.table}
                  </code>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground">{access.operations}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RoleHierarchyTree() {
  const platformRoles = roleDefinitions.filter(r => r.scope === "platform");
  const appRoles = roleDefinitions.filter(r => r.scope === "app");
  const orgRoles = roleDefinitions.filter(r => r.scope === "organization");
  const teamRoles = roleDefinitions.filter(r => r.scope === "team");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Role Architecture</CardTitle>
              <CardDescription>
                Complete role hierarchy with capabilities, restrictions, and RLS mappings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hierarchy" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="hierarchy" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="matrix" className="text-xs">
                <TableIcon className="w-3 h-3 mr-1" />
                Matrix
              </TabsTrigger>
              <TabsTrigger value="functions" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                Functions
              </TabsTrigger>
              <TabsTrigger value="entitlements" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Entitlements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 pb-4 border-b">
                {Object.entries(scopeConfig).map(([scope, config]) => (
                  <div key={scope} className="flex items-center gap-2 text-xs">
                    <Badge variant={config.badge} className="text-xs">{scope}</Badge>
                    <span className="text-muted-foreground">{config.description}</span>
                  </div>
                ))}
              </div>

              {/* Role Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Level */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-role-admin" />
                    Platform Level
                    <Badge variant="secondary" className="text-xs">{platformRoles.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {platformRoles.map((role) => (
                      <RoleCard key={role.id} role={role} />
                    ))}
                  </div>
                </div>

                {/* App Level */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-role-operator" />
                    App Roles (Capabilities)
                    <Badge variant="secondary" className="text-xs">{appRoles.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {appRoles.map((role) => (
                      <RoleCard key={role.id} role={role} />
                    ))}
                  </div>
                </div>

                {/* Organization Level */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-role-org-owner" />
                    Organization Level
                    <Badge variant="secondary" className="text-xs">{orgRoles.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {orgRoles.map((role) => (
                      <RoleCard key={role.id} role={role} />
                    ))}
                  </div>
                </div>

                {/* Team Level */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Team Level
                    <Badge variant="secondary" className="text-xs">{teamRoles.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {teamRoles.map((role) => (
                      <RoleCard key={role.id} role={role} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="matrix">
              <RolePermissionMatrix />
            </TabsContent>

            <TabsContent value="functions">
              <DatabaseFunctionsReference />
            </TabsContent>

            <TabsContent value="entitlements">
              <EntitlementsReference />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
