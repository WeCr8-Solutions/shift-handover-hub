import { useState, useMemo } from "react";
import {
  useMachineLibrary,
  useStationMachineAssignment,
  MachineLibraryEntry,
} from "@/hooks/useStationMachineProfile";
import { useOrgContext } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import {
  Loader2, Cpu, ShieldCheck, CreditCard, CheckCircle2,
  Search, X, Link2, Unlink, Package, ChevronDown, ChevronUp,
  Ruler, Weight, CircleDot, Layers, ShoppingBag,
} from "lucide-react";

interface Props {
  stationId?: string | null;
  stationName?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MachineProfileMarketplace({ stationId, stationName, open, onOpenChange }: Props) {
  const inline = open === undefined;
  const { organization } = useOrgContext();
  const orgId = organization?.id || null;
  const { library, purchases, loading: libLoading, isPurchased, purchaseMachine, verifyPurchase, refreshPurchases } =
    useMachineLibrary(orgId);
  
  const hasStation = !!stationId;
  const { assignment, loading: assignLoading, assignMachine, unassignMachine } =
    useStationMachineAssignment(hasStation ? stationId! : null, orgId);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [detailMachine, setDetailMachine] = useState<MachineLibraryEntry | null>(null);
  const [activeTab, setActiveTab] = useState("browse");

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

  const ownedMachines = useMemo(() => {
    const ownedIds = new Set(purchases.filter(p => p.is_active).map(p => p.machine_library_id));
    return library.filter(m => ownedIds.has(m.id));
  }, [library, purchases]);

  const handleVerify = async (libraryId: string) => {
    setVerifyingId(libraryId);
    const ok = await verifyPurchase(libraryId);
    setVerifyingId(null);
    if (ok) {
      toast({ title: "Purchase verified!", description: "Machine profile is now in your inventory." });
    } else {
      toast({ title: "Not yet", description: "Payment not found. Complete checkout and try again.", variant: "destructive" });
    }
  };

  const handlePurchase = async (libraryId: string) => {
    await purchaseMachine(libraryId);
  };

  const handleAssign = async (libraryId: string) => {
    if (!stationId) return;
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

  const loading = libLoading || (hasStation && assignLoading);

  const marketplaceContent = (
    <>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="browse" className="gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Browse Catalog
              <Badge variant="secondary" className="text-[10px] ml-1">{library.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Package className="w-3.5 h-3.5" />
              My Inventory
              <Badge variant="secondary" className="text-[10px] ml-1">{ownedMachines.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Current Assignment Banner */}
          {hasStation && assignment?.machine && (
            <Card className="border-green-500/30 bg-green-500/5 mt-3">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-700 truncate">
                      Currently assigned: {assignment.machine.manufacturer} {assignment.machine.model}
                    </p>
                    <p className="text-xs text-green-600/70">{assignment.machine.machine_type}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleUnassign} className="shrink-0 gap-1">
                  <Unlink className="w-3 h-3" /> Unassign
                </Button>
              </CardContent>
            </Card>
          )}

          <TabsContent value="browse" className="flex-1 min-h-0 flex flex-col mt-3 space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {machineTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No machines found matching your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                  {filtered.map((m) => (
                    <MachineCard
                      key={m.id}
                      machine={m}
                      owned={isPurchased(m.id)}
                      isAssigned={hasStation && assignment?.machine?.id === m.id}
                      hasStation={hasStation}
                      verifying={verifyingId === m.id}
                      assigning={assigningId === m.id}
                      onPurchase={() => handlePurchase(m.id)}
                      onVerify={() => handleVerify(m.id)}
                      onAssign={() => handleAssign(m.id)}
                      onViewDetails={() => setDetailMachine(m)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventory" className="flex-1 min-h-0 flex flex-col mt-3">
            <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
              {ownedMachines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No purchased profiles yet.</p>
                  <p className="text-xs mt-1">Browse the catalog to purchase machine profiles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                  {ownedMachines.map((m) => (
                    <MachineCard
                      key={m.id}
                      machine={m}
                      owned
                      isAssigned={hasStation && assignment?.machine?.id === m.id}
                      hasStation={hasStation}
                      verifying={false}
                      assigning={assigningId === m.id}
                      onPurchase={() => {}}
                      onVerify={() => {}}
                      onAssign={() => handleAssign(m.id)}
                      onViewDetails={() => setDetailMachine(m)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  // Inline mode: render content directly without Dialog wrapper
  if (inline) {
    return (
      <>
        {marketplaceContent}
        {detailMachine && (
          <MachineDetailDialog
            machine={detailMachine}
            owned={isPurchased(detailMachine.id)}
            isAssigned={hasStation && assignment?.machine?.id === detailMachine.id}
            hasStation={hasStation}
            onClose={() => setDetailMachine(null)}
            onPurchase={() => handlePurchase(detailMachine.id)}
            onVerify={() => handleVerify(detailMachine.id)}
            onAssign={() => handleAssign(detailMachine.id)}
            verifying={verifyingId === detailMachine.id}
            assigning={assigningId === detailMachine.id}
          />
        )}
      </>
    );
  }

  // Dialog mode
  return (
    <>
      <Dialog open={open && !detailMachine} onOpenChange={onOpenChange!}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Machine Profile Marketplace
              {stationName && <Badge variant="outline" className="text-xs font-normal ml-1">for {stationName}</Badge>}
            </DialogTitle>
            <DialogDescription>
              Browse verified machine profiles. Purchase once ($0.99), reuse across unlimited stations.
            </DialogDescription>
          </DialogHeader>

          {marketplaceContent}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange!(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailMachine && (
        <MachineDetailDialog
          machine={detailMachine}
          owned={isPurchased(detailMachine.id)}
          isAssigned={hasStation && assignment?.machine?.id === detailMachine.id}
          hasStation={hasStation}
          onClose={() => setDetailMachine(null)}
          onPurchase={() => handlePurchase(detailMachine.id)}
          onVerify={() => handleVerify(detailMachine.id)}
          onAssign={() => handleAssign(detailMachine.id)}
          verifying={verifyingId === detailMachine.id}
          assigning={assigningId === detailMachine.id}
        />
      )}
    </>
  );
}

/* ────────── Machine Card ────────── */

function MachineCard({
  machine, owned, isAssigned, hasStation, verifying, assigning,
  onPurchase, onVerify, onAssign, onViewDetails,
}: {
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
}) {
  return (
    <Card className={`transition-colors hover:border-primary/30 ${isAssigned ? "border-green-500/50 bg-green-500/5" : owned ? "border-primary/20" : ""}`}>
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onViewDetails}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-semibold truncate">{machine.manufacturer}</h4>
              {machine.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
              )}
              {owned && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Owned</Badge>
              )}
              {isAssigned && (
                <Badge className="text-[10px] bg-green-600 shrink-0">Assigned</Badge>
              )}
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
          {machine.max_x_travel && <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" /> X:{machine.max_x_travel}mm</span>}
          {machine.max_y_travel && <span>Y:{machine.max_y_travel}mm</span>}
          {machine.max_z_travel && <span>Z:{machine.max_z_travel}mm</span>}
          {machine.max_part_weight && <span className="flex items-center gap-0.5"><Weight className="w-3 h-3" /> {machine.max_part_weight}lbs</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onViewDetails}>
            View Specs
          </Button>
          <div className="flex gap-1">
            {owned ? (
              hasStation && !isAssigned ? (
                <Button size="sm" className="h-7 text-xs gap-1" disabled={assigning} onClick={(e) => { e.stopPropagation(); onAssign(); }}>
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
                <Button size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onPurchase(); }}>
                  <CreditCard className="w-3 h-3" /> $0.99
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onVerify(); }} disabled={verifying}>
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

/* ────────── Detail Dialog ────────── */

function MachineDetailDialog({
  machine, owned, isAssigned, hasStation, onClose,
  onPurchase, onVerify, onAssign, verifying, assigning,
}: {
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
}) {
  const capabilities = [
    machine.five_axis_simultaneous && "5-Axis Simultaneous",
    machine.fourth_axis && "4th Axis",
    machine.live_tooling && "Live Tooling",
    machine.y_axis_turn && "Y-Axis Turn",
    machine.sub_spindle && "Sub Spindle",
    machine.probing && "Probing",
    machine.through_spindle_coolant && "Through Spindle Coolant",
    machine.pallet_pool && "Pallet Pool",
    machine.bar_feeder && "Bar Feeder",
  ].filter(Boolean);

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
          {/* Travel & Envelope */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" /> Travel & Envelope
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <SpecItem label="X Travel" value={machine.max_x_travel} unit="mm" />
              <SpecItem label="Y Travel" value={machine.max_y_travel} unit="mm" />
              <SpecItem label="Z Travel" value={machine.max_z_travel} unit="mm" />
              <SpecItem label="Part Length" value={machine.max_part_envelope_length} unit="in" />
              <SpecItem label="Part Width" value={machine.max_part_envelope_width} unit="in" />
              <SpecItem label="Part Height" value={machine.max_part_envelope_height} unit="in" />
              <SpecItem label="Max Weight" value={machine.max_part_weight} unit="lbs" />
              <SpecItem label="Tolerance" value={machine.typical_tolerance ? `±${machine.typical_tolerance}"` : null} />
            </div>
          </div>

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Capabilities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <Badge key={cap as string} variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {machine.material_capability.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5" /> Material Capability
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {machine.material_capability.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Back</Button>
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

/* ────────── Spec Item ────────── */

function SpecItem({ label, value, unit }: { label: string; value: number | string | null | undefined; unit?: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium">
        {value}{unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
