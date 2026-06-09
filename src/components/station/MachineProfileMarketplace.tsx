import { useState, useMemo } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import {
  useMachineLibrary,
  useStationMachineAssignment,
  MachineLibraryEntry,
} from "@/hooks/useStationMachineProfile";
import { useOrgContext } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Cpu, Search, X, Unlink, Package, CheckCircle2, ShoppingBag,
} from "lucide-react";
import { MarketplaceCatalogCard } from "./MarketplaceCatalogCard";
import { MachineDetailDialog } from "./MachineDetailDialog";

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
  const { library, purchases, loading: libLoading, isPurchased, purchaseMachine, verifyPurchase } =
    useMachineLibrary(orgId);

  const hasStation = !!stationId;
  const { assignment, loading: assignLoading, assignMachine, unassignMachine } =
    useStationMachineAssignment(hasStation ? stationId! : null, orgId);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useUrlState<string>("mfr", "all");
  const [filterType, setFilterType] = useUrlState<string>("type", "all");
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
      const matchesSearch =
        !q ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.machine_type.toLowerCase().includes(q);
      const matchesMfg = filterManufacturer === "all" || m.manufacturer === filterManufacturer;
      const matchesType = filterType === "all" || m.machine_type === filterType;
      return matchesSearch && matchesMfg && matchesType;
    });
  }, [library, search, filterManufacturer, filterType]);

  const ownedMachines = useMemo(() => {
    const ownedIds = new Set(purchases.filter((p) => p.is_active).map((p) => p.machine_library_id));
    return library.filter((m) => ownedIds.has(m.id));
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

  const renderMachineGrid = (machines: MachineLibraryEntry[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
      {machines.map((m) => (
        <MarketplaceCatalogCard
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
  );

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
                renderMachineGrid(filtered)
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
                renderMachineGrid(ownedMachines)
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  const detailDialog = detailMachine && (
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
  );

  // Inline mode
  if (inline) {
    return (
      <>
        {marketplaceContent}
        {detailDialog}
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
              {stationName && (
                <Badge variant="outline" className="text-xs font-normal ml-1">
                  for {stationName}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Browse verified machine profiles. Purchase once ($0.99), reuse across unlimited stations.
            </DialogDescription>
          </DialogHeader>
          {marketplaceContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange!(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {detailDialog}
    </>
  );
}
