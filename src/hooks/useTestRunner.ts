import { useState, useEffect, useCallback } from "react";

export interface TestResult {
  id: string;
  name: string;
  status: "pass" | "fail" | "pending" | "running";
  duration?: number;
  error?: string;
  suite: string;
  timestamp: Date;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  pending: number;
  duration: number;
}

export interface TestRunSummary {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed";
  suites: TestSuite[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage?: {
    lines: number;
    statements: number;
    branches: number;
    functions: number;
  };
}

// Mock test data for demonstration
const mockTestSuites: TestSuite[] = [
  {
    name: "Button Component",
    tests: [
      { id: "btn-1", name: "renders with default variant", status: "pass", duration: 12, suite: "Button Component", timestamp: new Date() },
      { id: "btn-2", name: "renders with different variants", status: "pass", duration: 45, suite: "Button Component", timestamp: new Date() },
      { id: "btn-3", name: "handles disabled state", status: "pass", duration: 8, suite: "Button Component", timestamp: new Date() },
      { id: "btn-4", name: "applies custom className", status: "pass", duration: 5, suite: "Button Component", timestamp: new Date() },
    ],
    totalTests: 4,
    passed: 4,
    failed: 0,
    pending: 0,
    duration: 70,
  },
  {
    name: "StatusBadge Component",
    tests: [
      { id: "sb-1", name: "renders ok status with correct styling", status: "pass", duration: 10, suite: "StatusBadge Component", timestamp: new Date() },
      { id: "sb-2", name: "renders warning status with correct styling", status: "pass", duration: 8, suite: "StatusBadge Component", timestamp: new Date() },
      { id: "sb-3", name: "renders critical status with correct styling", status: "pass", duration: 9, suite: "StatusBadge Component", timestamp: new Date() },
      { id: "sb-4", name: "applies pulse animation", status: "pass", duration: 7, suite: "StatusBadge Component", timestamp: new Date() },
    ],
    totalTests: 4,
    passed: 4,
    failed: 0,
    pending: 0,
    duration: 34,
  },
  {
    name: "useEmail Hook",
    tests: [
      { id: "email-1", name: "calls edge function for welcome email", status: "pass", duration: 25, suite: "useEmail Hook", timestamp: new Date() },
      { id: "email-2", name: "handles email sending errors", status: "pass", duration: 15, suite: "useEmail Hook", timestamp: new Date() },
      { id: "email-3", name: "calls edge function for team invite", status: "pass", duration: 20, suite: "useEmail Hook", timestamp: new Date() },
      { id: "email-4", name: "calls edge function for password reset", status: "pass", duration: 18, suite: "useEmail Hook", timestamp: new Date() },
    ],
    totalTests: 4,
    passed: 4,
    failed: 0,
    pending: 0,
    duration: 78,
  },
  {
    name: "Utils",
    tests: [
      { id: "util-1", name: "cn merges class names correctly", status: "pass", duration: 3, suite: "Utils", timestamp: new Date() },
      { id: "util-2", name: "cn handles conditional classes", status: "pass", duration: 2, suite: "Utils", timestamp: new Date() },
      { id: "util-3", name: "cn handles tailwind merge", status: "pass", duration: 4, suite: "Utils", timestamp: new Date() },
    ],
    totalTests: 3,
    passed: 3,
    failed: 0,
    pending: 0,
    duration: 9,
  },
  {
    name: "Edge Functions",
    tests: [
      { id: "edge-1", name: "send-email: handles CORS preflight", status: "pass", duration: 150, suite: "Edge Functions", timestamp: new Date() },
      { id: "edge-2", name: "send-email: returns error for missing fields", status: "pass", duration: 120, suite: "Edge Functions", timestamp: new Date() },
      { id: "edge-3", name: "send-email: validates email type parameter", status: "pass", duration: 200, suite: "Edge Functions", timestamp: new Date() },
    ],
    totalTests: 3,
    passed: 3,
    failed: 0,
    pending: 0,
    duration: 470,
  },
];

export function useTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<TestRunSummary | null>(null);
  const [testHistory, setTestHistory] = useState<TestRunSummary[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  // Load test history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("test-history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTestHistory(parsed.map((run: TestRunSummary) => ({
          ...run,
          startTime: new Date(run.startTime),
          endTime: run.endTime ? new Date(run.endTime) : undefined,
        })));
      } catch (e) {
        console.error("Failed to parse test history:", e);
      }
    }
  }, []);

  // Save test history to localStorage
  const saveHistory = useCallback((history: TestRunSummary[]) => {
    localStorage.setItem("test-history", JSON.stringify(history.slice(0, 20))); // Keep last 20 runs
  }, []);

  const runTests = useCallback(async (suiteFilter?: string) => {
    setIsRunning(true);
    
    const runId = `run-${Date.now()}`;
    const startTime = new Date();
    
    // Initialize the run
    const initialRun: TestRunSummary = {
      id: runId,
      startTime,
      status: "running",
      suites: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    };
    setCurrentRun(initialRun);

    // Simulate running tests with delays
    const suitesToRun = suiteFilter 
      ? mockTestSuites.filter(s => s.name === suiteFilter)
      : mockTestSuites;

    const completedSuites: TestSuite[] = [];

    for (const suite of suitesToRun) {
      // Simulate running each test
      const runningTests: TestResult[] = [];
      
      for (const test of suite.tests) {
        runningTests.push({ ...test, status: "running" });
        
        setCurrentRun(prev => prev ? {
          ...prev,
          suites: [
            ...completedSuites,
            { ...suite, tests: [...runningTests] }
          ],
        } : null);

        // Simulate test execution time
        await new Promise(resolve => setTimeout(resolve, test.duration || 10));

        // Update test to completed
        runningTests[runningTests.length - 1] = { ...test, status: "pass" };
      }

      completedSuites.push({ ...suite, tests: runningTests });
      
      setCurrentRun(prev => prev ? {
        ...prev,
        suites: completedSuites,
        totalTests: completedSuites.reduce((acc, s) => acc + s.totalTests, 0),
        passedTests: completedSuites.reduce((acc, s) => acc + s.passed, 0),
        failedTests: completedSuites.reduce((acc, s) => acc + s.failed, 0),
      } : null);
    }

    // Finalize the run
    const finalRun: TestRunSummary = {
      id: runId,
      startTime,
      endTime: new Date(),
      status: "completed",
      suites: completedSuites,
      totalTests: completedSuites.reduce((acc, s) => acc + s.totalTests, 0),
      passedTests: completedSuites.reduce((acc, s) => acc + s.passed, 0),
      failedTests: completedSuites.reduce((acc, s) => acc + s.failed, 0),
      coverage: {
        lines: 87.5,
        statements: 85.2,
        branches: 72.3,
        functions: 91.0,
      },
    };

    setCurrentRun(finalRun);
    setIsRunning(false);

    // Add to history
    const newHistory = [finalRun, ...testHistory];
    setTestHistory(newHistory);
    saveHistory(newHistory);

    return finalRun;
  }, [testHistory, saveHistory]);

  const clearHistory = useCallback(() => {
    setTestHistory([]);
    localStorage.removeItem("test-history");
  }, []);

  return {
    isRunning,
    currentRun,
    testHistory,
    selectedSuite,
    setSelectedSuite,
    runTests,
    clearHistory,
    availableSuites: mockTestSuites.map(s => s.name),
  };
}
