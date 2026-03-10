/**
 * Shared marketing mock "app window" chrome.
 * Replaces 11 duplicate definitions across marketing components.
 */
export function AppWindowChrome({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-2xl overflow-hidden ${className || ""}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-status-ok/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-medium">{title}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
