import { useState, useMemo } from "react";
import {
  useMachineLibrary,
  useStationMachineAssignment,
  MachineLibraryEntry,
} from "@/hooks/useStationMachineProfile";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import {
  Loader2, Cpu, ShieldCheck, CreditCard, CheckCircle2,
  Search, X, Link2, Unlink,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StationManufacturerAttach({ stationId, stationName, open, onOpenChange }: Props) {
  const { organization } = useUserOrganization();
  const orgId = organization?.id || null;
  const { library, purchases, loading: libLoading, isPurchased, purchaseMachine, verifyPurchase } =
    useMachineLibrary(orgId);
  const { assignment, loading: assignLoading, assignMachine, unassignMachine } =
    useStationMachineAssignment(stationId, orgId);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const manufacturers = useMemo(() => {
    const set = new Set(library.map((m) => m.manufacturer));
    return Array.from(set).sort();
  }, [library]);

  const machineTypes = useMemo(() => {
    const set = new Set(library.map((m) => m.machine_type));
    return Array.from(set).sort();
  }, [library]);

  const filtered = useMemo(() => {
    return library.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.machine_type.toLowerCase().includes(q);
      const matchesMfg = filterManufacturer === "all" || m.manufacturer === filterManufacturer;
      const matchesType = filterType === "all" || m.machine_type === filterType;
      return matchesSearch && matchesMfg && matchesType;
    });
  }, [library, search, filterManufacturer, filterType]);

  const handleVerify = async (libraryId: string) => {
    setVerifyingId(libraryId);
    const ok = await verifyPurchase(libraryId);
    setVerifyingId(null);
    if (ok) {
      toast({ title: "Purchase verified!", description: "Machine profile is now available for assignment." });
    } else {
      toast({ title: "Not yet", description: "Payment not found. Complete checkout and try again.", variant: "destructive" });
    }
  };

  const handleAssign = async (libraryId: string) => {
    const purchase = purchases.find((p) => p.machine_library_id === libraryId);
    if (!purchase) return;
    setAssigningId(libraryId);
    const { error } = await assignMachine(purchase.id);
    setAssigningId(null);
    if (error) {
      toast({ title: "Assignment failed", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Machine assigned!", description: `Station "${stationName}" now has manufacturer context.` });
    }
  };

  const handleUnassign = async () => {
    await unassignMachine();
    toast({ title: "Machine unassigned" });
  };

  const loading = libLoading || assignLoading;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Machine Library — {stationName}
          </DialogTitle>
          <DialogDescription>
            Purchase verified machine profiles ($0.99 each) and assign them to stations. Purchased profiles can be reused across multiple stations.
          </DialogDescription>
        </DialogHeader>

        {/* Current Assignment */}
        {assignment?.machine && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {assignment.machine.manufacturer} {assignment.machine.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.machine.machine_type} · {assignment.machine.platform_category}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleUnassign} className="text-muted-foreground">
                <Unlink className="w-4 h-4 mr-1" /> Remove
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search machines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Manufacturers</SelectItem>
              {manufacturers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Machine Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {machineTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Library List */}
        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
          <div className="space-y-2 pb-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No machines match your search.</p>
            )}
            {filtered.map((machine) => {
              const owned = isPurchased(machine.id);
              const isAssigned = assignment?.machine?.id === machine.id;
              return (
                <MachineRow
                  key={machine.id}
                  machine={machine}
                  owned={owned}
                  isAssigned={isAssigned}
                  verifying={verifyingId === machine.id}
                  assigning={assigningId === machine.id}
                  onPurchase={() => purchaseMachine(machine.id)}
                  onVerify={() => handleVerify(machine.id)}
                  onAssign={() => handleAssign(machine.id)}
                />
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MachineRow({
  machine, owned, isAssigned, verifying, assigning,
  onPurchase, onVerify, onAssign,
}: {
  machine: MachineLibraryEntry;
  owned: boolean;
  isAssigned: boolean;
  verifying: boolean;
  assigning: boolean;
  onPurchase: () => void;
  onVerify: () => void;
  onAssign: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-colors ${isAssigned ? "border-green-500/50 bg-green-500/5" : ""}`}>
      <CardHeader className="p-3 pb-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-sm truncate">
              {machine.manufacturer} {machine.model}
            </CardTitle>
            {machine.is_verified && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
              </Badge>
            )}
            {isAssigned && (
              <Badge variant="default" className="text-[10px] bg-green-600 shrink-0">Assigned</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {owned ? (
              <Button size="sm" variant={isAssigned ? "outline" : "default"} disabled={isAssigned || assigning} onClick={(e) => { e.stopPropagation(); onAssign(); }}>
                {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3 mr-1" />}
                {isAssigned ? "Assigned" : "Attach"}
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onPurchase(); }} className="gap-1">
                  <CreditCard className="w-3 h-3" /> $0.99
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onVerify(); }} disabled={verifying}>
                  {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className="text-[10px]">{machine.machine_type}</Badge>
          <Badge variant="outline" className="text-[10px]">{machine.platform_category}</Badge>
          {machine.five_axis_simultaneous && <Badge variant="outline" className="text-[10px]">5-Axis</Badge>}
          {machine.live_tooling && <Badge variant="outline" className="text-[10px]">Live Tooling</Badge>}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-2 text-xs space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {machine.max_x_travel && <div><span className="text-muted-foreground">X:</span> {machine.max_x_travel}mm</div>}
            {machine.max_y_travel && <div><span className="text-muted-foreground">Y:</span> {machine.max_y_travel}mm</div>}
            {machine.max_z_travel && <div><span className="text-muted-foreground">Z:</span> {machine.max_z_travel}mm</div>}
            {machine.max_part_weight && <div><span className="text-muted-foreground">Max Weight:</span> {machine.max_part_weight} lbs</div>}
            {machine.typical_tolerance && <div><span className="text-muted-foreground">Tolerance:</span> ±{machine.typical_tolerance}"</div>}
          </div>
          {machine.material_capability.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {machine.material_capability.map((m) => <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>)}
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-muted-foreground">
            {machine.fourth_axis && <span>4th Axis</span>}
            {machine.sub_spindle && <span>Sub Spindle</span>}
            {machine.y_axis_turn && <span>Y-Axis Turn</span>}
            {machine.probing && <span>Probing</span>}
            {machine.through_spindle_coolant && <span>TSC</span>}
            {machine.pallet_pool && <span>Pallet Pool</span>}
            {machine.bar_feeder && <span>Bar Feeder</span>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
