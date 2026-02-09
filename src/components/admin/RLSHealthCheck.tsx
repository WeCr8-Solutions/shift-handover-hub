import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Activity
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

export function RLSHealthCheck() {
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

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
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
              <div className="p-4 rounded-lg bg-green-500/10">
                <div className="text-3xl font-bold text-green-600">{currentRun.summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10">
                <div className="text-3xl font-bold text-red-600">{currentRun.summary.failed}</div>
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
                    <span className="text-green-600 font-medium">All tests passing ✓</span>
                  ) : (
                    <span className="text-red-600 font-medium">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRun.results.map((result, i) => (
                    <TableRow key={i} className={result.passed ? "" : "bg-red-500/5"}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Failed tests detail */}
            {currentRun.results.filter(r => !r.passed).length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Failed Tests Require Attention
                </div>
                <ul className="text-sm space-y-1">
                  {currentRun.results.filter(r => !r.passed).map((r, i) => (
                    <li key={i} className="text-red-600">
                      • <strong>{r.name}</strong>: Expected {r.expected}, got {r.actual}
                      {r.error && <span className="text-xs ml-2">({r.error})</span>}
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                    run.failed === 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {run.failed === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
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
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      {run.passed} passed
                    </Badge>
                    {run.failed > 0 && (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600">
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
