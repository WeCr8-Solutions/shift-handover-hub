import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, CreditCard, Link2, Ruler, Weight } from "lucide-react";
import type { MachineLibraryEntry } from "@/hooks/useStationMachineProfile";

interface MarketplaceCatalogCardProps {
  machine: MachineLibraryEntry;
  owned: boolean;
  isAssigned: boolean;
  hasStation: boolean;
  verifying: boolean;
  assigning: boolean;
  onPurchase: () => void;
  onVerify: () => void;
  onAssign: () => void;
  onViewDetails: () => void;
}

export function MarketplaceCatalogCard({
  machine,
  owned,
  isAssigned,
  hasStation,
  verifying,
  assigning,
  onPurchase,
  onVerify,
  onAssign,
  onViewDetails,
}: MarketplaceCatalogCardProps) {
  return (
    <Card
      className={`transition-colors hover:border-primary/30 ${
        isAssigned ? "border-green-500/50 bg-green-500/5" : owned ? "border-primary/20" : ""
      }`}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onViewDetails}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-semibold truncate">{machine.manufacturer}</h4>
              {machine.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
              {owned && <Badge variant="secondary" className="text-[10px] shrink-0">Owned</Badge>}
              {isAssigned && <Badge className="text-[10px] bg-green-600 shrink-0">Assigned</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">{machine.model}</p>
          </div>
        </div>

        {/* Quick specs */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">{machine.machine_type}</Badge>
          <Badge variant="outline" className="text-[10px]">{machine.platform_category}</Badge>
          {machine.five_axis_simultaneous && <Badge variant="outline" className="text-[10px]">5-Axis</Badge>}
          {machine.live_tooling && <Badge variant="outline" className="text-[10px]">Live Tooling</Badge>}
        </div>

        {/* Compact spec row */}
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {machine.max_x_travel && (
            <span className="flex items-center gap-0.5">
              <Ruler className="w-3 h-3" /> X:{machine.max_x_travel}mm
            </span>
          )}
          {machine.max_y_travel && <span>Y:{machine.max_y_travel}mm</span>}
          {machine.max_z_travel && <span>Z:{machine.max_z_travel}mm</span>}
          {machine.max_part_weight && (
            <span className="flex items-center gap-0.5">
              <Weight className="w-3 h-3" /> {machine.max_part_weight}lbs
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onViewDetails}>
            View Specs
          </Button>
          <div className="flex gap-1">
            {owned ? (
              hasStation && !isAssigned ? (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={assigning}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign();
                  }}
                >
                  {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                  Attach to Station
                </Button>
              ) : isAssigned ? (
                <Badge className="bg-green-600 text-[10px]">Attached</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">In Inventory</Badge>
              )
            ) : (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase();
                  }}
                >
                  <CreditCard className="w-3 h-3" /> $0.99
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerify();
                  }}
                  disabled={verifying}
                >
                  {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
