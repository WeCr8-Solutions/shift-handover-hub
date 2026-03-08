import { useActAs } from "@/contexts/ActAsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, ShieldAlert } from "lucide-react";

export function ActAsBanner() {
  const { target, isActingAs, stopActAs } = useActAs();

  if (!isActingAs || !target) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Eye className="w-4 h-4" />
          <span className="font-semibold text-sm">VIEW-ONLY MODE</span>
        </div>
        <span className="text-sm truncate">
          Viewing as{" "}
          <span className="font-bold">{target.displayName}</span>
          {target.email && (
            <span className="opacity-70"> ({target.email})</span>
          )}
        </span>
        {target.organizationName && (
          <Badge className="bg-amber-600/30 text-amber-950 border-amber-700/40 text-[10px] shrink-0">
            {target.organizationName}
          </Badge>
        )}
        {target.orgRole && (
          <Badge className="bg-amber-600/30 text-amber-950 border-amber-700/40 text-[10px] shrink-0">
            {target.orgRole}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-[10px] opacity-70">
          <ShieldAlert className="w-3 h-3" />
          Read-only · No mutations
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 bg-amber-600/20 border-amber-700/50 text-amber-950 hover:bg-amber-600/40"
          onClick={stopActAs}
        >
          <X className="w-3 h-3" />
          Exit
        </Button>
      </div>
    </div>
  );
}
