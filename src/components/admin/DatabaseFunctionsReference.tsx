import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Shield, Building2, Users, Zap, Settings } from "lucide-react";
import { databaseFunctions, DatabaseFunction } from "@/hooks/useRoleArchitecture";

const categoryConfig = {
  "role-check": { label: "Role Checks", icon: Shield, color: "bg-red-500/10 text-red-500 border-red-500/20" },
  "org-check": { label: "Org Checks", icon: Building2, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  "team-check": { label: "Team Checks", icon: Users, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "feature-check": { label: "Feature/Limits", icon: Zap, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "utility": { label: "Utility", icon: Settings, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

function FunctionCard({ func }: { func: DatabaseFunction }) {
  const config = categoryConfig[func.category];
  const Icon = config.icon;

  return (
    <div className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <code className="text-sm font-semibold text-primary">{func.name}</code>
        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>
      <div className="space-y-1">
        <code className="text-xs text-muted-foreground block">
          ({func.arguments}) → {func.returnType}
        </code>
        <p className="text-xs text-muted-foreground">{func.description}</p>
      </div>
    </div>
  );
}

export function DatabaseFunctionsReference() {
  const groupedFunctions = databaseFunctions.reduce((acc, func) => {
    if (!acc[func.category]) acc[func.category] = [];
    acc[func.category].push(func);
    return acc;
  }, {} as Record<string, DatabaseFunction[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          Database Helper Functions
        </CardTitle>
        <CardDescription>
          Security definer functions used in RLS policies - {databaseFunctions.length} functions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedFunctions).map(([category, funcs]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;
            return (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {config.label}
                  <Badge variant="secondary" className="text-xs">{funcs.length}</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {funcs.map((func) => (
                    <FunctionCard key={func.name} func={func} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage Examples */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Code className="w-4 h-4" />
            RLS Policy Example
          </h4>
          <pre className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
{`-- Allow supervisors to update performance updates in their org
CREATE POLICY "Supervisors can update status"
ON job_performance_updates
FOR UPDATE
USING (
  is_supervisor_in_org(auth.uid(), 
    (SELECT organization_id FROM teams WHERE id = team_id)
  )
)
WITH CHECK (
  is_supervisor_in_org(auth.uid(), 
    (SELECT organization_id FROM teams WHERE id = team_id)
  )
);`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
