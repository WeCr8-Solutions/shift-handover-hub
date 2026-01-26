import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface TestRunnerControlsProps {
  isRunning: boolean;
  onRunTests: () => void;
  onClearHistory: () => void;
  hasHistory: boolean;
}

export function TestRunnerControls({
  isRunning,
  onRunTests,
  onClearHistory,
  hasHistory,
}: TestRunnerControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Test Runner</CardTitle>
            <CardDescription>
              Execute unit tests, component tests, and edge function tests
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistory}
                disabled={isRunning}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
            <Button
              onClick={onRunTests}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Vitest + React Testing Library</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Deno Test Runner</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Edge Function Tests</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
