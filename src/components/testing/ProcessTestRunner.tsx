import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  Factory,
  Database,
  Shield,
  GitBranch,
  Workflow,
  UserCog,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProcessTests, ProcessTestResult, ProcessTestSuite } from "@/hooks/useProcessTests";

function getCategoryIcon(category: string) {
  switch (category) {
    case "routing":
      return <GitBranch className="w-4 h-4" />;
    case "workflow":
      return <Workflow className="w-4 h-4" />;
    case "database":
      return <Database className="w-4 h-4" />;
    case "manufacturing":
      return <Factory className="w-4 h-4" />;
    case "security":
      return <Shield className="w-4 h-4" />;
    case "autofill":
      return <UserCog className="w-4 h-4" />;
    case "quote-to-ship":
      return <Route className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

function TestStatusIcon({ status }: { status: ProcessTestResult["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "skipped":
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function SuiteCard({ suite, isExpanded }: { suite: ProcessTestSuite; isExpanded?: boolean }) {
  const passRate = suite.totalTests > 0 
    ? Math.round((suite.passed / suite.totalTests) * 100) 
    : 0;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCategoryIcon(suite.category)}
          <div>
            <h4 className="font-semibold text-sm">{suite.name}</h4>
            <p className="text-xs text-muted-foreground">{suite.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={suite.failed > 0 ? "destructive" : "default"} className="text-xs">
            {suite.passed}/{suite.totalTests} passed
          </Badge>
          <span className="text-xs text-muted-foreground">{suite.duration}ms</span>
        </div>
      </div>

      <Progress value={passRate} className="h-1.5" />

      <div className="space-y-1">
        {suite.tests.map((test) => (
          <div
            key={test.id}
            className={cn(
              "flex items-start justify-between py-2 px-3 rounded text-sm",
              test.status === "pass" && "bg-green-50 dark:bg-green-950/20",
              test.status === "fail" && "bg-red-50 dark:bg-red-950/20",
              test.status === "running" && "bg-blue-50 dark:bg-blue-950/20",
            )}
          >
            <div className="flex items-start gap-2 flex-1">
              <TestStatusIcon status={test.status} />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground block">{test.name}</span>
                {test.details && (
                  <span className="text-xs text-green-600 dark:text-green-400 block mt-0.5">
                    ✓ {test.details}
                  </span>
                )}
                {test.error && (
                  <span className="text-xs text-red-600 dark:text-red-400 block mt-0.5">
                    ✗ {test.error}
                  </span>
                )}
              </div>
            </div>
            {test.duration && (
              <span className="text-xs text-muted-foreground ml-2">
                {test.duration}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProcessTestRunner() {
  const {
    isRunning,
    currentRun,
    runProcessTests,
    clearHistory,
    availableSuites,
  } = useProcessTests();

  const progress = currentRun && currentRun.totalTests > 0
    ? Math.round(((currentRun.passedTests + currentRun.failedTests) / currentRun.totalTests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Factory className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Process Tests</CardTitle>
                <CardDescription>
                  Automated tests for manufacturing workflows, routing, and data integrity
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => runProcessTests()}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Process Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableSuites.map((suite) => (
              <Badge key={suite} variant="outline" className="text-xs">
                {suite}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {currentRun && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Test Results</CardTitle>
                <CardDescription>
                  {isRunning 
                    ? "Running process tests..." 
                    : `Completed at ${currentRun.endTime?.toLocaleTimeString()}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentRun.passedTests} passed</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>{currentRun.failedTests} failed</span>
                </div>
                <div className="text-muted-foreground">
                  {currentRun.totalTests} total
                </div>
              </div>
            </div>
            {isRunning && (
              <Progress value={progress} className="mt-3" />
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {currentRun.suites.map((suite) => (
                  <SuiteCard key={suite.name} suite={suite} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!currentRun && (
        <Card className="h-[300px]">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Factory className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No process test results yet</p>
              <p className="text-sm">Run process tests to validate manufacturing workflows</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
