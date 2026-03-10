import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Terminal, ChevronDown, Copy, Check, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ConsoleLogEntry } from "@/hooks/useIssueDetail";
import { LOG_LEVEL_STYLES, LOG_LEVEL_BADGE_STYLES } from "@/lib/status-colors";

type LogLevel = ConsoleLogEntry["level"] | "all";

interface ConsoleLogViewerProps {
  logs: ConsoleLogEntry[];
  maxHeight?: number;
  defaultExpanded?: boolean;
}

export function ConsoleLogViewer({
  logs,
  maxHeight = 300,
  defaultExpanded = false,
}: ConsoleLogViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [levelFilter, setLevelFilter] = useState<LogLevel>("all");
  const [copied, setCopied] = useState(false);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { error: 0, warn: 0, info: 0, log: 0, debug: 0 };
    for (const entry of logs) {
      counts[entry.level] = (counts[entry.level] || 0) + 1;
    }
    return counts;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (levelFilter === "all") return logs;
    return logs.filter((l) => l.level === levelFilter);
  }, [logs, levelFilter]);

  const handleCopy = useCallback(async () => {
    const text = filteredLogs
      .map((l) => {
        const ts = l.timestamp ? formatTimestamp(l.timestamp) : "";
        const line = `[${ts}] [${l.level.toUpperCase()}] ${l.message}`;
        return l.stack ? `${line}\n${l.stack}` : line;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: `${filteredLogs.length} log entries copied` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [filteredLogs]);

  if (logs.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-muted/50">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="w-4 h-4" />
            Console Logs
            <Badge variant="secondary" className="text-xs">
              {logs.length}
            </Badge>
            {levelCounts.error > 0 && (
              <Badge className={`${LOG_LEVEL_BADGE_STYLES.error} text-xs`}>
                {levelCounts.error} error{levelCounts.error > 1 ? "s" : ""}
              </Badge>
            )}
            {levelCounts.warn > 0 && (
              <Badge className={`${LOG_LEVEL_BADGE_STYLES.warn} text-xs`}>
                {levelCounts.warn} warn
              </Badge>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border rounded-lg bg-background/50 overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-1.5 p-2 border-b bg-muted/30 flex-wrap">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            {(["all", "error", "warn", "info", "log", "debug"] as LogLevel[]).map((level) => {
              const count = level === "all" ? logs.length : levelCounts[level] || 0;
              if (level !== "all" && count === 0) return null;
              const isActive = levelFilter === level;
              return (
                <Button
                  key={level}
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    isActive
                      ? level === "all"
                        ? "bg-primary/20 text-primary"
                        : LOG_LEVEL_BADGE_STYLES[level]
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setLevelFilter(level)}
                >
                  {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="ml-1 opacity-70">({count})</span>
                </Button>
              );
            })}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Log entries */}
          <ScrollArea style={{ maxHeight }}>
            <div className="font-mono text-xs divide-y divide-border/50">
              {filteredLogs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No {levelFilter} logs found
                </div>
              ) : (
                filteredLogs.map((entry, i) => (
                  <LogEntry key={`${entry.timestamp}-${i}`} entry={entry} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function LogEntry({ entry }: { entry: ConsoleLogEntry }) {
  const [stackOpen, setStackOpen] = useState(false);

  return (
    <div className={`px-3 py-1.5 ${LOG_LEVEL_STYLES[entry.level]}`}>
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground/60 shrink-0 select-none">
          {entry.timestamp ? formatTimestamp(entry.timestamp) : "—"}
        </span>
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] px-1 py-0 leading-4 uppercase ${LOG_LEVEL_BADGE_STYLES[entry.level]}`}
        >
          {entry.level}
        </Badge>
        <span className="break-all whitespace-pre-wrap flex-1">{entry.message}</span>
      </div>
      {entry.stack && (
        <Collapsible open={stackOpen} onOpenChange={setStackOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] mt-1 text-muted-foreground">
              {stackOpen ? "Hide" : "Show"} stack trace
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-background/50 p-2 rounded">
              {entry.stack}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  } catch {
    return iso.slice(11, 23);
  }
}
