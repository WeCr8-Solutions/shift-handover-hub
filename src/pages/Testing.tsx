import { useEffect, useState } from "react";
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
import { ProcessTestRunner } from "@/components/testing/ProcessTestRunner";
import { RoleScopeTestRunner } from "@/components/testing/RoleScopeTestRunner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FlaskConical, Code, Factory, Zap, CheckCircle2, XCircle, Clock, FileCode2, ShieldCheck } from "lucide-react";

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

  // Calculate overall stats
  const totalTests = testHistory.length > 0 
    ? testHistory[0].totalTests 
    : 0;
  const lastRunPassed = testHistory.length > 0 
    ? testHistory[0].passedTests 
    : 0;
  const lastRunFailed = testHistory.length > 0 
    ? testHistory[0].failedTests 
    : 0;

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
                Run and monitor tests for components, hooks, edge functions, and manufacturing processes
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileCode2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{availableSuites.length}</p>
                  <p className="text-xs text-muted-foreground">Test Suites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRunPassed}</p>
                  <p className="text-xs text-muted-foreground">Tests Passed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lastRunFailed}</p>
                  <p className="text-xs text-muted-foreground">Tests Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{testHistory.length}</p>
                  <p className="text-xs text-muted-foreground">Test Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Type Tabs */}
        <Tabs defaultValue="unit" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="unit" className="gap-2">
              <FlaskConical className="w-4 h-4" />
              Unit Tests
            </TabsTrigger>
            <TabsTrigger value="edge" className="gap-2">
              <Zap className="w-4 h-4" />
              Edge Functions
            </TabsTrigger>
            <TabsTrigger value="process" className="gap-2">
              <Factory className="w-4 h-4" />
              Process Tests
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Roles & Scope
            </TabsTrigger>
          </TabsList>

          {/* Unit Tests Tab */}
          <TabsContent value="unit" className="space-y-6">
            <TestRunnerControls
              isRunning={isRunning}
              onRunTests={() => runTests(selectedSuite || undefined)}
              onClearHistory={clearHistory}
              hasHistory={testHistory.length > 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              <div className="lg:col-span-2 space-y-6">
                <TestResultsPanel
                  run={currentRun}
                  isRunning={isRunning}
                />
              </div>
            </div>

            <TestHistoryList
              history={testHistory}
              onClearHistory={clearHistory}
            />
          </TabsContent>

          {/* Edge Functions Tab */}
          <TabsContent value="edge" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle>Edge Function Tests</CardTitle>
                    <CardDescription>
                      Test Supabase Edge Functions for email, webhooks, and API endpoints
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "send-email", description: "Email sending with templates", status: "ready" },
                      { name: "check-subscription", description: "Subscription status verification", status: "ready" },
                      { name: "create-checkout", description: "Stripe checkout session creation", status: "ready" },
                      { name: "customer-portal", description: "Stripe customer portal access", status: "ready" },
                      { name: "stripe-webhook", description: "Stripe webhook event handling", status: "ready" },
                      { name: "report-issue", description: "Issue reporting and logging", status: "ready" },
                      { name: "rls-health", description: "RLS policy health check", status: "ready" },
                      { name: "create-donation", description: "Donation processing", status: "ready" },
                      { name: "social-agent", description: "Social media integration", status: "ready" },
                    ].map((fn) => (
                      <div key={fn.name} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{fn.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {fn.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{fn.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Edge function tests are run via Deno test runner. 
                      Use the <code className="px-1 py-0.5 bg-muted rounded text-xs">supabase--test-edge-functions</code> tool 
                      to execute these tests against deployed functions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Process Tests Tab */}
          <TabsContent value="process">
            <ProcessTestRunner />
          </TabsContent>

          {/* Role & Scope Tests Tab */}
          <TabsContent value="roles">
            <RoleScopeTestRunner />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}