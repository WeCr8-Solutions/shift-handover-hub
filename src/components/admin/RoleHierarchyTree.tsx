import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Database
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface RoleNode {
  id: string;
  name: string;
  scope: "platform" | "organization" | "team";
  description: string;
  icon: React.ReactNode;
  color: string;
  permissions: string[];
  rlsTables: string[];
  children?: RoleNode[];
}

const roleHierarchy: RoleNode[] = [
  {
    id: "admin",
    name: "Platform Admin",
    scope: "platform",
    description: "Full platform access, reserved for system owner",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-red-500",
    permissions: [
      "Access all organizations",
      "Manage platform settings",
      "View global activity logs",
      "Assign developer roles",
      "Access admin panel"
    ],
    rlsTables: [
      "user_roles (full access)",
      "activity_logs (SELECT all)",
      "issues (full access)",
      "dev_issue_queue (full access)"
    ],
    children: [
      {
        id: "developer",
        name: "Developer",
        scope: "platform",
        description: "Testing tools, debugging, API access",
        icon: <Code className="w-4 h-4" />,
        color: "bg-orange-500",
        permissions: [
          "Access Testing panel",
          "View debug information",
          "Run test suites",
          "Access RLS health checks"
        ],
        rlsTables: [
          "rls_health_checks (SELECT/INSERT)",
          "process_tests (full access)",
          "test_runs (full access)",
          "dev_issue_queue (SELECT/UPDATE assigned)"
        ],
        children: []
      }
    ]
  },
  {
    id: "org_owner",
    name: "Org Owner",
    scope: "organization",
    description: "Full organization control via organization_members",
    icon: <Building2 className="w-4 h-4" />,
    color: "bg-purple-500",
    permissions: [
      "Manage billing & subscription",
      "Delete organization",
      "Transfer ownership",
      "All admin capabilities"
    ],
    rlsTables: [
      "organizations (full access)",
      "organization_members (full access)",
      "subscriptions (full access)",
      "entitlements (full access)"
    ],
    children: [
      {
        id: "org_admin",
        name: "Org Admin",
        scope: "organization",
        description: "Organization management (except billing/delete)",
        icon: <Users className="w-4 h-4" />,
        color: "bg-indigo-500",
        permissions: [
          "Create/manage teams",
          "Invite/remove members",
          "Generate invite codes",
          "Assign org-level roles"
        ],
        rlsTables: [
          "teams (full within org)",
          "team_members (full within org)",
          "organization_invites (full within org)",
          "stations (full within org)"
        ],
        children: [
          {
            id: "supervisor",
            name: "Supervisor",
            scope: "organization",
            description: "Production oversight, expediting",
            icon: <UserCheck className="w-4 h-4" />,
            color: "bg-sky-500",
            permissions: [
              "Approve/reject performance updates",
              "Override work order assignments",
              "View team analytics",
              "Manage station assignments"
            ],
            rlsTables: [
              "job_performance_updates (UPDATE status)",
              "queue_items (UPDATE priority)",
              "work_order_routing (UPDATE)",
              "handoff_records (SELECT team)"
            ],
            children: [
              {
                id: "operator",
                name: "Operator",
                scope: "team",
                description: "Shop floor execution (default role)",
                icon: <Wrench className="w-4 h-4" />,
                color: "bg-green-500",
                permissions: [
                  "Submit handoff records",
                  "Update work order status",
                  "Submit performance updates",
                  "View assigned stations"
                ],
                rlsTables: [
                  "handoff_records (INSERT/SELECT own)",
                  "queue_items (SELECT assigned)",
                  "job_performance_updates (INSERT own)",
                  "current_station_status (UPDATE assigned)"
                ],
                children: [
                  {
                    id: "viewer",
                    name: "Viewer",
                    scope: "team",
                    description: "Read-only dashboards",
                    icon: <Eye className="w-4 h-4" />,
                    color: "bg-gray-500",
                    permissions: [
                      "View dashboards",
                      "View queue status",
                      "View handoff history"
                    ],
                    rlsTables: [
                      "stations (SELECT org)",
                      "queue_items (SELECT org)",
                      "handoff_records (SELECT org)"
                    ],
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

function RoleNodeComponent({ node, depth = 0 }: { node: RoleNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const scopeBadgeVariant = {
    platform: "destructive" as const,
    organization: "default" as const,
    team: "secondary" as const,
  };

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-muted-foreground/30"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className="relative flex items-start gap-2 py-2"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {/* Horizontal connector */}
          {depth > 0 && (
            <div 
              className="absolute top-5 border-t-2 border-dashed border-muted-foreground/30"
              style={{ left: `${(depth - 1) * 24 + 12}px`, width: "12px" }}
            />
          )}
          
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-2 transition-colors w-full text-left group">
              {/* Role Icon */}
              <div className={`w-8 h-8 rounded-full ${node.color} text-white flex items-center justify-center shrink-0`}>
                {node.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{node.name}</span>
                  <Badge variant={scopeBadgeVariant[node.scope]} className="text-xs">
                    {node.scope}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{node.description}</p>
              </div>
              
              {node.children && node.children.length > 0 && (
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              )}
            </button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          {/* Permissions & RLS Tables */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-dashed mb-2"
            style={{ paddingLeft: `${depth * 24 + 44}px`, paddingRight: "8px" }}
          >
            {/* Permissions */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Lock className="w-3 h-3" />
                Capabilities
              </div>
              <ul className="text-xs space-y-0.5">
                {node.permissions.map((perm, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* RLS Tables */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Database className="w-3 h-3" />
                RLS Access
              </div>
              <ul className="text-xs space-y-0.5">
                {node.rlsTables.map((table, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                      {table}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Children */}
          {node.children?.map((child) => (
            <RoleNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function RoleHierarchyTree() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Role Hierarchy</CardTitle>
            <CardDescription>
              Visual permission structure for RLS debugging
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="destructive" className="text-xs">platform</Badge>
            <span className="text-muted-foreground">Global access via user_roles</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="default" className="text-xs">organization</Badge>
            <span className="text-muted-foreground">Scoped via organization_members</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-xs">team</Badge>
            <span className="text-muted-foreground">Scoped via team_members</span>
          </div>
        </div>
        
        {/* Two hierarchy trees side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform hierarchy */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Platform Level
            </h4>
            <div className="border rounded-lg p-3 bg-muted/30">
              {roleHierarchy.filter(r => r.scope === "platform").map((role) => (
                <RoleNodeComponent key={role.id} node={role} />
              ))}
            </div>
          </div>
          
          {/* Organization hierarchy */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              Organization Level
            </h4>
            <div className="border rounded-lg p-3 bg-muted/30">
              {roleHierarchy.filter(r => r.scope === "organization").map((role) => (
                <RoleNodeComponent key={role.id} node={role} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Helper Functions Reference */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            RLS Helper Functions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">has_role</span>(user_id, role)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_org_admin</span>(user_id, org_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_org_member</span>(user_id, org_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_team_admin</span>(user_id, team_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_team_member</span>(user_id, team_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_supervisor_for_team</span>(user_id, team_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_dev_or_admin</span>(user_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">is_in_same_org</span>(caller_id, target_id)
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-primary">get_user_org_id</span>(user_id)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
