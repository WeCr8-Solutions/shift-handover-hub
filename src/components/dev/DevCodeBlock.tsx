import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevCodeExample } from "@/lib/devDocs";

interface DevCodeBlockProps {
  examples: DevCodeExample[];
  className?: string;
}

export function DevCodeBlock({ examples, className }: DevCodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(examples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden bg-muted/30", className)}>
      {/* Language tabs */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-1">
        <div className="flex gap-0">
          {examples.map((ex, i) => (
            <button
              key={ex.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors border-b-2",
                i === activeTab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
          title="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-foreground/90 font-mono text-[13px]">
          {examples[activeTab].code}
        </code>
      </pre>
    </div>
  );
}
