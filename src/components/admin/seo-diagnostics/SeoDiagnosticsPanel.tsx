import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Search,
} from "lucide-react";
import { ALL_CHECKS, type CheckResult, type CheckSeverity } from "./checks";

const SEVERITY_META: Record<CheckSeverity, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pass: { label: "Pass", icon: CheckCircle2, className: "text-green-600 dark:text-green-400" },
  warn: { label: "Warning", icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400" },
  fail: { label: "Fail", icon: XCircle, className: "text-destructive" },
};

function SeverityBadge({ status }: { status: CheckSeverity }) {
  const meta = SEVERITY_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </Badge>
  );
}

function CheckCard({ result }: { result: CheckResult }) {
  const [open, setOpen] = useState(result.status !== "pass");
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {result.label}
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Open ${result.url} in new tab`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </CardTitle>
            <CardDescription>{result.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <SeverityBadge status={result.status} />
            <span className="text-[10px] text-muted-foreground">{result.durationMs}ms</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.summary.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {result.summary.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        )}

        {result.issues.length > 0 && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 gap-1">
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "" : "-rotate-90"}`} />
                {result.issues.length} finding{result.issues.length === 1 ? "" : "s"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {result.issues.map((issue, i) => {
                const Icon = SEVERITY_META[issue.severity].icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 rounded-md border bg-muted/30"
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${SEVERITY_META[issue.severity].className}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{issue.message}</div>
                      {issue.detail && (
                        <pre className="mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                          {issue.detail}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {result.raw && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 gap-1 text-muted-foreground">
                <ChevronDown className="w-3 h-3" />
                Raw response
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-[10px] bg-muted/40 rounded p-2 mt-1 overflow-x-auto max-h-64">
                {result.raw}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SEO Diagnostics — modular checker for crawler artifacts and on-page SEO.
 * Each entry in ALL_CHECKS runs independently; failures don't block siblings.
 */
export function SeoDiagnosticsPanel() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAll = useCallback(async () => {
    setRunning(true);
    setResults([]);
    const collected: CheckResult[] = [];
    for (const check of ALL_CHECKS) {
      try {
        const r = await check();
        collected.push(r);
      } catch (err) {
        collected.push({
          id: check.name,
          label: check.name,
          description: "Check crashed",
          status: "fail",
          durationMs: 0,
          summary: [],
          issues: [{ severity: "fail", message: "Check threw an exception", detail: String(err) }],
        });
      }
      // Stream results progressively
      setResults([...collected]);
    }
    setRunning(false);
    setLastRun(new Date());
  }, []);

  const counts = useMemo(() => {
    const c = { pass: 0, warn: 0, fail: 0 };
    for (const r of results) c[r.status]++;
    return c;
  }, [results]);

  const ready = counts.fail === 0 && results.length === ALL_CHECKS.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                SEO Diagnostics
              </CardTitle>
              <CardDescription>
                Verify robots.txt, sitemap.xml, llms.txt, canonical tags, JSON-LD, and AdSense ownership
                files before submitting to Google.
              </CardDescription>
            </div>
            <Button onClick={runAll} disabled={running} className="gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {running ? "Running…" : results.length > 0 ? "Re-run checks" : "Run checks"}
            </Button>
          </div>
        </CardHeader>
        {results.length > 0 && (
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap text-sm">
              <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                {counts.pass} passing
              </Badge>
              <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {counts.warn} warnings
              </Badge>
              <Badge variant="outline" className="gap-1 text-destructive">
                <XCircle className="w-3 h-3" />
                {counts.fail} failures
              </Badge>
              {lastRun && (
                <span className="text-xs text-muted-foreground self-center">
                  Last run: {lastRun.toLocaleTimeString()}
                </span>
              )}
            </div>

            {ready && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Ready to submit</AlertTitle>
                <AlertDescription>
                  All critical checks passed. Address warnings to strengthen E-E-A-T before resubmitting
                  to Google Search Console and AdSense.
                </AlertDescription>
              </Alert>
            )}

            {counts.fail > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Fix {counts.fail} failure{counts.fail === 1 ? "" : "s"} before submitting</AlertTitle>
                <AlertDescription>
                  Failures will cause indexing or AdSense review to reject the site.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {results.map((r) => (
          <CheckCard key={r.id} result={r} />
        ))}
        {running && results.length < ALL_CHECKS.length && (
          <Card>
            <CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running check {results.length + 1} of {ALL_CHECKS.length}…
            </CardContent>
          </Card>
        )}
      </div>

      {results.length === 0 && !running && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Click <strong>Run checks</strong> to audit your SEO artifacts. Checks run against the current
            origin so what you see here matches what Google's crawler will see.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
