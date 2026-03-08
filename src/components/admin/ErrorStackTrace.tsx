import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ErrorStackTraceProps {
  errorMessage: string | null;
  errorStack: string | null;
}

export function ErrorStackTrace({ errorMessage, errorStack }: ErrorStackTraceProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(!!errorMessage);

  const handleCopy = useCallback(async () => {
    const text = [errorMessage, errorStack].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Error details copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [errorMessage, errorStack]);

  if (!errorMessage && !errorStack) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-red-500/5">
          <span className="flex items-center gap-2 text-sm font-medium text-red-500">
            <AlertTriangle className="w-4 h-4" />
            Error Details
            <Badge className="bg-red-500/20 text-red-400 text-xs">Error</Badge>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-red-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border border-red-500/20 rounded-lg bg-red-500/5 overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b border-red-500/10">
            <span className="text-xs text-red-400 font-medium uppercase tracking-wider">
              Runtime Error
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/10"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="p-3 space-y-3">
            {errorMessage && (
              <div>
                <p className="text-sm font-semibold text-red-400 break-all">{errorMessage}</p>
              </div>
            )}

            {errorStack && (
              <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all bg-background/60 p-3 rounded border border-border/50 max-h-[200px] overflow-y-auto">
                {highlightStackPaths(errorStack)}
              </pre>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Returns the stack trace string as-is for now.
 * In a future iteration, this could return JSX with highlighted file paths.
 */
function highlightStackPaths(stack: string): string {
  return stack;
}
