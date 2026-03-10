import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { TestRunSummary, TestResult } from "@/hooks/useTestRunner";
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResultsPanelProps {
  run: TestRunSummary | null;
  isRunning: boolean;
}

function TestResultIcon({ status }: { status: TestResult["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-status-ok" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-status-critical" />;
    case "running":
      return <Loader2 className="w-4 h-4 text-status-waiting animate-spin" />;
    case "pending":
      return <Clock className="w-4 h-4 text-status-warning" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: TestResult["status"]) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pass: "default",
    fail: "destructive",
    running: "secondary",
    pending: "outline",
  };
  
  return (
    <Badge variant={variants[status] || "secondary"} className="capitalize text-xs">
      {status}
    </Badge>
  );
}

export function TestResultsPanel({ run, isRunning }: TestResultsPanelProps) {
  if (!run) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Click "Run Tests" to execute the test suite
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No test results yet</p>
            <p className="text-sm">Run the tests to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = run.totalTests > 0 
    ? Math.round((run.passedTests + run.failedTests) / run.totalTests * 100)
    : 0;

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {isRunning ? "Running tests..." : `Completed at ${run.endTime?.toLocaleTimeString()}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>{run.passedTests} passed</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              <span>{run.failedTests} failed</span>
            </div>
            <div className="text-muted-foreground">
              {run.totalTests} total
            </div>
          </div>
        </div>
        {isRunning && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {run.suites.map((suite) => (
              <div key={suite.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{suite.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {suite.duration}ms
                  </span>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-muted">
                  {suite.tests.map((test) => (
                    <div
                      key={test.id}
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded text-sm",
                        test.status === "pass" && "bg-green-50 dark:bg-green-950/20",
                        test.status === "fail" && "bg-red-50 dark:bg-red-950/20",
                        test.status === "running" && "bg-blue-50 dark:bg-blue-950/20",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <TestResultIcon status={test.status} />
                        <span className="text-muted-foreground">{test.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
