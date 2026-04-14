import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export function MockQualityCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg max-w-md mx-auto">
      <h3 className="font-semibold text-lg mb-4">Quality Summary</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-muted-foreground">12 NCRs closed this week</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <span className="text-muted-foreground">3 CAPAs pending review</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-muted-foreground">1 critical NCR open — Station 4</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>First-pass yield</span>
          <span className="font-medium text-foreground">97.2%</span>
        </div>
      </div>
    </div>
  );
}
