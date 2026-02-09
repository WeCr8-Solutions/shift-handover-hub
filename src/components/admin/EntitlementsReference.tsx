import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Lock, Infinity, Check, X } from "lucide-react";
import { entitlements } from "@/hooks/useRoleArchitecture";

export function EntitlementsReference() {
  const limits = entitlements.filter(e => e.type === "limit");
  const features = entitlements.filter(e => e.type === "feature");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Entitlements & Limits
        </CardTitle>
        <CardDescription>
          Feature flags and resource limits enforced via database functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Limits */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Resource Limits
            <Badge variant="secondary" className="text-xs">{limits.length}</Badge>
          </h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Limit Key</TableHead>
                  <TableHead>Free</TableHead>
                  <TableHead>Pro</TableHead>
                  <TableHead>Enterprise</TableHead>
                  <TableHead>Enforced By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limits.map((limit) => (
                  <TableRow key={limit.key}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{limit.key}</code>
                      <p className="text-xs text-muted-foreground mt-1">{limit.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(limit.plans.free)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(limit.plans.pro)}</Badge>
                    </TableCell>
                    <TableCell>
                      {limit.plans.enterprise === "unlimited" ? (
                        <Badge variant="secondary" className="gap-1">
                          <Infinity className="w-3 h-3" />
                          Unlimited
                        </Badge>
                      ) : (
                        <Badge variant="outline">{String(limit.plans.enterprise)}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] font-mono text-muted-foreground">{limit.enforcedBy}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Feature Flags */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Feature Flags
            <Badge variant="secondary" className="text-xs">{features.length}</Badge>
          </h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature Key</TableHead>
                  <TableHead className="text-center">Free</TableHead>
                  <TableHead className="text-center">Pro</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                  <TableHead>Enforced By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{feature.key}</code>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.plans.free ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.plans.pro ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.plans.enterprise ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] font-mono text-muted-foreground">{feature.enforcedBy}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Enforcement Flow */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-semibold mb-2">Enforcement Flow</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. <code>check_limit_access(org_id, 'stations', 1)</code> → Called in RLS policy before INSERT</p>
            <p>2. Queries <code>entitlements</code> table for org's plan limits</p>
            <p>3. Counts current usage from relevant table</p>
            <p>4. Returns TRUE if (current + increment) ≤ limit</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
