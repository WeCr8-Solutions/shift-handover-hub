import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useTestRunner } from "@/hooks/useTestRunner";
import { Header } from "@/components/Header";
import { TestRunnerControls } from "@/components/testing/TestRunnerControls";
import { TestResultsPanel } from "@/components/testing/TestResultsPanel";
import { TestCoverageCard } from "@/components/testing/TestCoverageCard";
import { TestHistoryList } from "@/components/testing/TestHistoryList";
import { TestSuiteSelector } from "@/components/testing/TestSuiteSelector";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, Code } from "lucide-react";

export default function Testing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDeveloper, hasTestingAccess, loading: accessLoading } = useAdminAccess();
  const {
    isRunning,
    currentRun,
    testHistory,
    selectedSuite,
    setSelectedSuite,
    runTests,
    clearHistory,
    availableSuites,
  } = useTestRunner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Only developers with the 'developer' role can access testing
  useEffect(() => {
    if (!accessLoading && !hasTestingAccess && user) {
      navigate("/dashboard");
    }
  }, [accessLoading, hasTestingAccess, user, navigate]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasTestingAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Testing Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Run and monitor tests for components, hooks, and edge functions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 bg-purple-600">
              <Code className="w-3 h-3" />
              SDK Developer
            </Badge>
          </div>
        </div>

        {/* Test Runner Controls */}
        <TestRunnerControls
          isRunning={isRunning}
          onRunTests={() => runTests(selectedSuite || undefined)}
          onClearHistory={clearHistory}
          hasHistory={testHistory.length > 0}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Suite Selector & Coverage */}
          <div className="space-y-6">
            <TestSuiteSelector
              suites={availableSuites}
              selectedSuite={selectedSuite}
              onSelectSuite={setSelectedSuite}
            />
            
            {currentRun?.coverage && (
              <TestCoverageCard coverage={currentRun.coverage} />
            )}
          </div>

          {/* Center Column - Test Results */}
          <div className="lg:col-span-2 space-y-6">
            <TestResultsPanel
              run={currentRun}
              isRunning={isRunning}
            />
          </div>
        </div>

        {/* Test History */}
        <TestHistoryList
          history={testHistory}
          onClearHistory={clearHistory}
        />
      </main>
    </div>
  );
}
