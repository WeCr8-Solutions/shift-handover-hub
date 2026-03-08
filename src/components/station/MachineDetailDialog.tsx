import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Cpu, ShieldCheck, CreditCard, CheckCircle2, Link2, Package } from "lucide-react";
import { MachineSpecGrid } from "./MachineSpecGrid";
import { MachineCapabilityBadges } from "./MachineCapabilityBadges";
import type { MachineLibraryEntry } from "@/hooks/useStationMachineProfile";

interface MachineDetailDialogProps {
  machine: MachineLibraryEntry;
  owned: boolean;
  isAssigned: boolean;
  hasStation: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onVerify: () => void;
  onAssign: () => void;
  verifying: boolean;
  assigning: boolean;
}

export function MachineDetailDialog({
  machine,
  owned,
  isAssigned,
  hasStation,
  onClose,
  onPurchase,
  onVerify,
  onAssign,
  verifying,
  assigning,
}: MachineDetailDialogProps) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            {machine.manufacturer} {machine.model}
            {machine.is_verified && (
              <Badge variant="secondary" className="text-xs">
                <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {machine.machine_type} · {machine.platform_category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <MachineSpecGrid specs={machine} />
          <MachineCapabilityBadges capabilities={machine} materials={machine.material_capability} />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <div className="flex gap-2">
            {owned ? (
              hasStation && !isAssigned ? (
                <Button disabled={assigning} onClick={onAssign} className="gap-1.5">
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Attach to Station
                </Button>
              ) : isAssigned ? (
                <Button disabled className="gap-1.5 bg-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Attached
                </Button>
              ) : (
                <Button disabled className="gap-1.5">
                  <Package className="w-4 h-4" /> In Your Inventory
                </Button>
              )
            ) : (
              <>
                <Button onClick={onPurchase} className="gap-1.5">
                  <CreditCard className="w-4 h-4" /> Purchase — $0.99
                </Button>
                <Button variant="outline" onClick={onVerify} disabled={verifying}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Payment"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
