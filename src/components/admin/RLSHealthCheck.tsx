import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCcw, 
  Loader2,
  Clock,
  Database,
  Lock,
  Unlock,
  GitBranch,
  Activity,
  MoreHorizontal,
  Eye,
  FileCode,
  Wrench,
  Copy,
  ExternalLink,
  Settings,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RoleHierarchyTree } from "./RoleHierarchyTree";

interface RLSHealthResult {
  name: string;
  table: string;
  operation: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  executionTime: number;
}

interface RLSHealthRun {
  run_id: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
  };
  results: RLSHealthResult[];
  timestamp: string;
}

interface HistoricalRun {
  run_id: string;
  created_at: string;
  passed: number;
  failed: number;
  total: number;
}

interface RLSHealthCheckProps {
  /** When set, the health-check is interpreted in the context of this org. Optional. */
  scopedOrgId?: string | null;
}

export function RLSHealthCheck({ scopedOrgId }: RLSHealthCheckProps = {}) {
  const [currentRun, setCurrentRun] = useState<RLSHealthRun | null>(null);
  const [historicalRuns, setHistoricalRuns] = useState<HistoricalRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch historical runs
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("rls_health_checks")
        .select("run_id, created_at, passed")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group by run_id
      const runMap = new Map<string, HistoricalRun>();
      data?.forEach((check) => {
        if (!runMap.has(check.run_id)) {
          runMap.set(check.run_id, {
            run_id: check.run_id,
            created_at: check.created_at,
            passed: 0,
            failed: 0,
            total: 0,
          });
        }
        const run = runMap.get(check.run_id)!;
        run.total++;
        if (check.passed) run.passed++;
        else run.failed++;
      });

      setHistoricalRuns(Array.from(runMap.values()).slice(0, 10));
    } catch (error) {
      console.error("Error fetching RLS history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Run health check
  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<RLSHealthRun>("rls-health");

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      setCurrentRun(data);
      fetchHistory(); // Refresh history

      if (data.summary.failed > 0) {
        toast({
          title: "RLS Health Check Failed",
          description: `${data.summary.failed} of ${data.summary.total} tests failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "RLS Health Check Passed",
          description: `All ${data.summary.total} tests passed`,
        });
      }
    } catch (error) {
      console.error("Error running RLS health check:", error);
      toast({
        title: "Failed to run health check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for dropdown actions
  const handleViewPolicy = (table: string, operation: string) => {
    const sql = `SELECT polname, polcmd, polroles, polqual, polwithcheck 
FROM pg_policies 
WHERE tablename = '${table}';`;
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "SQL Copied",
      description: `Query to view ${table} RLS policies copied to clipboard`,
    });
  };

  const handleCopyTestSQL = (result: RLSHealthResult) => {
    const sql = `-- Test: ${result.name}
-- Table: ${result.table}, Operation: ${result.operation.toUpperCase()}
-- Expected: ${result.expected}, Actual: ${result.actual}

SELECT * FROM ${result.table} LIMIT 1;`;
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "Test SQL Copied",
      description: "Test query copied to clipboard",
    });
  };

  const handleAddDenyPolicy = (table: string, operation: string) => {
    const policyName = `deny_anon_${operation}_${table}`;
    const sql = `-- Add deny policy for anonymous users on ${table}
CREATE POLICY "${policyName}"
ON public.${table}
FOR ${operation.toUpperCase()}
TO anon
USING (false);`;
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "Deny Policy SQL Copied",
      description: `Add this policy to restrict ${operation} on ${table}`,
    });
  };

  const handleAddAllowPolicy = (table: string, operation: string) => {
    const policyName = `allow_auth_${operation}_${table}`;
    const sql = `-- Add allow policy for authenticated users on ${table}
CREATE POLICY "${policyName}"
ON public.${table}
FOR ${operation.toUpperCase()}
TO authenticated
USING (auth.uid() = user_id);  -- Adjust condition as needed`;
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "Allow Policy SQL Copied",
      description: `Add this policy to allow ${operation} on ${table}`,
    });
  };

  const handleGenerateFix = (result: RLSHealthResult) => {
    let sql = `-- Fix for: ${result.name}\n`;
    sql += `-- Table: ${result.table}, Operation: ${result.operation.toUpperCase()}\n`;
    sql += `-- Expected: ${result.expected}, Actual: ${result.actual}\n\n`;
    
    if (result.expected === "deny" && result.actual === "allow") {
      sql += `-- Option 1: Enable RLS if not already enabled
ALTER TABLE public.${result.table} ENABLE ROW LEVEL SECURITY;

-- Option 2: Add restrictive policy
CREATE POLICY "deny_unauthorized_${result.operation}_${result.table}"
ON public.${result.table}
FOR ${result.operation.toUpperCase()}
USING (false);`;
    } else if (result.expected === "allow" && result.actual === "deny") {
      sql += `-- Check if RLS is blocking authenticated access
-- Add an allow policy for authenticated users
CREATE POLICY "allow_auth_${result.operation}_${result.table}"
ON public.${result.table}
FOR ${result.operation.toUpperCase()}
TO authenticated
USING (
  -- Adjust this condition based on your access rules
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);`;
    }
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "Fix SQL Generated",
      description: "SQL fix copied to clipboard. Review before applying!",
    });
  };

  const handleGenerateAllFixes = () => {
    if (!currentRun) return;
    
    const failedTests = currentRun.results.filter(r => !r.passed);
    let sql = `-- Generated RLS Fixes\n-- ${failedTests.length} failed tests\n\n`;
    
    failedTests.forEach((result, i) => {
      sql += `-- Fix ${i + 1}: ${result.name}\n`;
      if (result.expected === "deny" && result.actual === "allow") {
        sql += `CREATE POLICY "deny_${result.operation}_${result.table}"
ON public.${result.table}
FOR ${result.operation.toUpperCase()}
USING (false);\n\n`;
      } else if (result.expected === "allow" && result.actual === "deny") {
        sql += `CREATE POLICY "allow_${result.operation}_${result.table}"
ON public.${result.table}
FOR ${result.operation.toUpperCase()}
TO authenticated
USING (auth.uid() = user_id);\n\n`;
      }
    });
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "All Fixes Generated",
      description: `${failedTests.length} fix(es) copied to clipboard`,
    });
  };

  const handleViewTableSchema = (table: string) => {
    const sql = `-- View table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '${table}'
ORDER BY ordinal_position;`;
    
    navigator.clipboard.writeText(sql);
    toast({
      title: "Schema Query Copied",
      description: `Query to view ${table} schema copied to clipboard`,
    });
  };

  const handleOpenDocs = (table: string) => {
    window.open("https://supabase.com/docs/guides/database/postgres/row-level-security", "_blank");
    toast({
      title: "Opening Documentation",
      description: "Supabase RLS documentation opened in new tab",
    });
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-primary" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "select":
        return <Database className="w-3 h-3" />;
      case "insert":
        return <Lock className="w-3 h-3" />;
      case "update":
        return <Lock className="w-3 h-3" />;
      case "delete":
        return <Unlock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs for switching between Health Check and Role Hierarchy */}
      <Tabs defaultValue="health-check" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health-check" className="gap-2">
            <Activity className="w-4 h-4" />
            Health Check
          </TabsTrigger>
          <TabsTrigger value="role-hierarchy" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Role Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health-check" className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>RLS Health Check</CardTitle>
                <CardDescription>
                  Verify Row Level Security policies are correctly configured
                </CardDescription>
              </div>
            </div>
            <Button onClick={runHealthCheck} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Run Health Check
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {currentRun && (
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold">{currentRun.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="text-3xl font-bold text-primary">{currentRun.summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <div className="text-3xl font-bold text-destructive">{currentRun.summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="text-3xl font-bold text-primary">{currentRun.summary.pass_rate}%</div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress 
                value={currentRun.summary.pass_rate} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>
                  {currentRun.summary.pass_rate === 100 ? (
                    <span className="text-primary font-medium">All tests passing ✓</span>
                  ) : (
                    <span className="text-destructive font-medium">
                      {currentRun.summary.failed} failing tests
                    </span>
                  )}
                </span>
                <span>100%</span>
              </div>
            </div>

             {/* Results Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRun.results.map((result, i) => (
                    <TableRow key={i} className={result.passed ? "" : "bg-destructive/5"}>
                      <TableCell>{getStatusIcon(result.passed)}</TableCell>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {result.table}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {getOperationIcon(result.operation)}
                          {result.operation.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.expected === "allow" ? "default" : "secondary"}>
                          {result.expected}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={result.actual === result.expected ? "default" : "destructive"}
                        >
                          {result.actual}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {result.executionTime}ms
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
                            <DropdownMenuLabel className="flex items-center gap-2">
                              {result.passed ? (
                                <ShieldCheck className="w-4 h-4 text-primary" />
                              ) : (
                                <ShieldX className="w-4 h-4 text-destructive" />
                              )}
                              {result.table} - {result.operation}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* View Actions */}
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleViewPolicy(result.table, result.operation)}
                            >
                              <Eye className="w-4 h-4" />
                              View RLS Policy
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleCopyTestSQL(result)}
                            >
                              <Copy className="w-4 h-4" />
                              Copy Test SQL
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Fix Actions - only show for failed tests */}
                            {!result.passed && (
                              <>
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                  Quick Fixes
                                </DropdownMenuLabel>
                                {result.expected === "deny" && result.actual === "allow" && (
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer text-destructive"
                                    onClick={() => handleAddDenyPolicy(result.table, result.operation)}
                                  >
                                    <Lock className="w-4 h-4" />
                                    Add Deny Policy
                                  </DropdownMenuItem>
                                )}
                                {result.expected === "allow" && result.actual === "deny" && (
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer"
                                    onClick={() => handleAddAllowPolicy(result.table, result.operation)}
                                  >
                                    <Unlock className="w-4 h-4" />
                                    Add Allow Policy
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="gap-2 cursor-pointer"
                                  onClick={() => handleGenerateFix(result)}
                                >
                                  <Wrench className="w-4 h-4" />
                                  Generate Fix SQL
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {/* Settings Actions */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleViewTableSchema(result.table)}
                            >
                              <FileCode className="w-4 h-4" />
                              View Table Schema
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleOpenDocs(result.table)}
                            >
                              <ExternalLink className="w-4 h-4" />
                              RLS Documentation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Failed tests detail */}
            {currentRun.results.filter(r => !r.passed).length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Failed Tests Require Attention
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleGenerateAllFixes}
                  >
                    <Wrench className="w-4 h-4" />
                    Generate All Fixes
                  </Button>
                </div>
                <ul className="text-sm space-y-1">
                  {currentRun.results.filter(r => !r.passed).map((r, i) => (
                    <li key={i} className="text-destructive flex items-center justify-between">
                      <span>
                        • <strong>{r.name}</strong>: Expected {r.expected}, got {r.actual}
                        {r.error && <span className="text-xs ml-2">({r.error})</span>}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => handleGenerateFix(r)}
                      >
                        Fix
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Historical Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Health Checks</CardTitle>
          <CardDescription>History of RLS verification runs</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : historicalRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No health checks have been run yet. Click "Run Health Check" to start.
            </div>
          ) : (
            <div className="space-y-2">
              {historicalRuns.map((run) => (
                <div
                  key={run.run_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    run.failed === 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {run.failed === 0 ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {run.run_id.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {run.passed} passed
                    </Badge>
                    {run.failed > 0 && (
                      <Badge variant="destructive">
                        {run.failed} failed
                      </Badge>
                    )}
                    <Progress 
                      value={(run.passed / run.total) * 100} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="role-hierarchy">
          <RoleHierarchyTree />
        </TabsContent>
      </Tabs>
    </div>
  );
}
