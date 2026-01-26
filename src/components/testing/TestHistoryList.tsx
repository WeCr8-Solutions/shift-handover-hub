import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestRunSummary } from "@/hooks/useTestRunner";
import { CheckCircle2, XCircle, Clock, Trash2, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TestHistoryListProps {
  history: TestRunSummary[];
  onClearHistory: () => void;
}

export function TestHistoryList({ history, onClearHistory }: TestHistoryListProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Test History</CardTitle>
              <CardDescription>Previous test run results</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearHistory}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {history.map((run) => (
              <div
                key={run.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  run.failedTests === 0 
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                )}
              >
                <div className="flex items-center gap-3">
                  {run.failedTests === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium text-sm">
                      {run.suites.length} suite{run.suites.length !== 1 ? "s" : ""} • {run.totalTests} test{run.totalTests !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(run.startTime, { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-green-600">
                    {run.passedTests} passed
                  </Badge>
                  {run.failedTests > 0 && (
                    <Badge variant="destructive">
                      {run.failedTests} failed
                    </Badge>
                  )}
                  {run.coverage && (
                    <Badge variant="outline">
                      {Math.round((run.coverage.lines + run.coverage.statements + run.coverage.branches + run.coverage.functions) / 4)}% coverage
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
