import { useActAs } from "@/contexts/ActAsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, ShieldAlert, FlaskConical } from "lucide-react";

export function ActAsBanner() {
  const { target, isActingAs, mode, stopActAs } = useActAs();

  if (!isActingAs || !target) return null;

  const isTestMode = mode === "test";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-between gap-3 shadow-lg backdrop-blur-sm ${
        isTestMode
          ? "bg-violet-500/95 text-violet-950"
          : "bg-amber-500/95 text-amber-950"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {isTestMode ? (
            <FlaskConical className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="font-semibold text-sm">
            {isTestMode ? "TEST MODE" : "VIEW-ONLY MODE"}
          </span>
        </div>
        <span className="text-sm truncate">
          {isTestMode ? "Testing as " : "Viewing as "}
          <span className="font-bold">{target.displayName}</span>
          {target.email && (
            <span className="opacity-70"> ({target.email})</span>
          )}
        </span>
        {target.organizationName && (
          <Badge
            className={`border text-[10px] shrink-0 ${
              isTestMode
                ? "bg-violet-600/30 text-violet-950 border-violet-700/40"
                : "bg-amber-600/30 text-amber-950 border-amber-700/40"
            }`}
          >
            {target.organizationName}
          </Badge>
        )}
        {target.orgRole && (
          <Badge
            className={`border text-[10px] shrink-0 ${
              isTestMode
                ? "bg-violet-600/30 text-violet-950 border-violet-700/40"
                : "bg-amber-600/30 text-amber-950 border-amber-700/40"
            }`}
          >
            {target.orgRole}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-[10px] opacity-70">
          <ShieldAlert className="w-3 h-3" />
          {isTestMode ? "Actions logged · Test verification" : "Read-only · No mutations"}
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`h-7 gap-1 border ${
            isTestMode
              ? "bg-violet-600/20 border-violet-700/50 text-violet-950 hover:bg-violet-600/40"
              : "bg-amber-600/20 border-amber-700/50 text-amber-950 hover:bg-amber-600/40"
          }`}
          onClick={stopActAs}
        >
          <X className="w-3 h-3" />
          Exit
        </Button>
      </div>
    </div>
  );
}
