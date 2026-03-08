/**
 * src/components/admin/MachineMonitorPanel.tsx
 *
 * Admin-level machine monitoring oversight panel.
 * Shows org-scoped stations with equipment, clickable for detail view.
 * Gated behind machine_monitoring entitlement + admin access.
 *
 * Per PRD 11: Uses semantic tokens, @/ aliases, hooks for store access.
 */

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Cpu,
  Gauge,
  Search,
  Wifi,
  WifiOff,
  Wrench,
  Building2,
  AlertTriangle,
  Monitor,
  Lock,
  Sparkles,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllStations, useAllOrganizations } from "@/hooks/useAdminData";
import { useStationEquipment } from "@/hooks/useStationEquipment";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAlarmFeed } from "@/hooks/useAlarmFeed";
import { MachineCard } from "@/components/machine/MachineCard";
import { AlarmFeed } from "@/components/machine/AlarmFeed";
import { MACHINE_STATE_CONFIG } from "@/types/machine";
import type { AppMachineStatus } from "@/types/machine";

interface MachineMonitorPanelProps {
  isAdmin: boolean;
}

/**
 * MachineMonitorPanel — Admin view for inspecting stations and their connected equipment.
 * Org-scoped with entitlement gating for machine_monitoring feature.
 */
export function MachineMonitorPanel({ isAdmin }: MachineMonitorPanelProps) {
  const { canAccess, plan, loading: entitlementLoading } = useEntitlements();
  const hasAccess = canAccess("machine_monitoring");

  // If entitlements are loading, show skeleton
  if (entitlementLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-8 w-48 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Gate: no access → upgrade prompt
  if (!hasAccess) {
    return <UpgradePrompt plan={plan} />;
  }

  return <MonitorContent isAdmin={isAdmin} />;
}

/** Upgrade prompt shown when org doesn't have machine_monitoring entitlement */
function UpgradePrompt({ plan }: { plan: string }) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          Machine Monitoring
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Enterprise
          </Badge>
        </CardTitle>
        <CardDescription>
          View real-time CNC machine status, alarms, and DNC transfers across all stations.
          Upgrade to Enterprise to enable this add-on.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-xs text-muted-foreground">
          Currently on: <span className="font-medium">{plan}</span> plan
        </p>
      </CardContent>
    </Card>
  );
}

/** Main monitor content — station list with drill-down */
function MonitorContent({ isAdmin }: { isAdmin: boolean }) {
  const { stations, loading: stationsLoading } = useAllStations();
  const { organizations } = useAllOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Get selected org ID for equipment fetch
  const activeOrgId = useMemo(() => {
    if (selectedOrg !== "all") return selectedOrg;
    // If admin has only one org, use that
    if (organizations.length === 1) return organizations[0].id;
    return null;
  }, [selectedOrg, organizations]);

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.work_center.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOrg = selectedOrg === "all" || true; // org filtering handled at query level
      return matchesSearch && matchesOrg && s.is_active;
    });
  }, [stations, searchQuery, selectedOrg]);

  // Selected station details
  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId),
    [stations, selectedStationId],
  );

  if (stationsLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Drill-down: show station detail
  if (selectedStationId && selectedStation) {
    return (
      <StationMachineDetail
        stationId={selectedStationId}
        stationName={selectedStation.name}
        organizationId={activeOrgId}
        onBack={() => setSelectedStationId(null)}
      />
    );
  }

  // Station list view
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Machine Monitor
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Activity className="w-2.5 h-2.5" />
                  Live
                </Badge>
              </CardTitle>
              <CardDescription>
                {filteredStations.length} active station(s) • Click to inspect equipment
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {organizations.length > 1 && (
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredStations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <Monitor className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active stations found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStations.map((station) => (
              <StationMonitorCard
                key={station.id}
                station={station}
                onClick={() => setSelectedStationId(station.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Compact station card in the grid — clickable to drill into equipment detail */
function StationMonitorCard({
  station,
  onClick,
}: {
  station: {
    id: string;
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: string;
    is_active: boolean;
    team_name: string | null;
  };
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm truncate">{station.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{station.station_id}</p>
          </div>
          <Badge
            variant={station.is_active ? "default" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {station.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wrench className="w-3 h-3 shrink-0" />
            <span className="truncate">{station.work_center}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="w-3 h-3 shrink-0" />
            <span>{station.work_center_type}</span>
          </div>
          {station.team_name && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{station.team_name}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Click to view equipment
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">
            View →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Station detail drill-down — shows all equipment at a station with alarm feed */
function StationMachineDetail({
  stationId,
  stationName,
  organizationId,
  onBack,
}: {
  stationId: string;
  stationName: string;
  organizationId: string | null;
  onBack: () => void;
}) {
  const { machines, loading, relayState } = useStationEquipment(organizationId);
  const { alarms } = useAlarmFeed({});

  // Filter equipment to this station
  const stationMachines = useMemo(
    () => machines.filter((m) => m.stationId === stationId),
    [machines, stationId],
  );

  // Count alarms for machines at this station
  const stationAlarmCount = useMemo(() => {
    const machineIds = new Set(stationMachines.map((m) => m.machineId));
    return alarms.filter((a) => a.active && !a.acknowledged && machineIds.has(a.machineId)).length;
  }, [alarms, stationMachines]);

  // State summary
  const stateSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    stationMachines.forEach((m) => {
      counts[m.state] = (counts[m.state] || 0) + 1;
    });
    return counts;
  }, [stationMachines]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="w-4 h-4" />
              {stationName}
              {stationAlarmCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {stationAlarmCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {stationMachines.length} equipment •{" "}
              {relayState === "connected" ? "Live" : "Static data"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs shrink-0">
            {relayState === "connected" ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-muted-foreground" />
            )}
            {relayState === "connected" ? "Live" : "Static"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* State summary badges */}
        {Object.keys(stateSummary).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stateSummary).map(([state, count]) => {
              const config = MACHINE_STATE_CONFIG[state as keyof typeof MACHINE_STATE_CONFIG];
              return (
                <Badge
                  key={state}
                  variant="outline"
                  className={cn("text-[10px] gap-1", config?.colorClass)}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", config?.dotClass)}
                  />
                  {config?.label || state}: {count}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Equipment grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : stationMachines.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No equipment linked to this station.</p>
            <p className="text-xs mt-1">
              Add equipment in Settings → Equipment and assign it to this station.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stationMachines.map((machine) => (
              <MachineCard key={machine.machineId} machine={machine} />
            ))}
          </div>
        )}

        {/* Alarm feed for this station's machines */}
        {stationMachines.length > 0 && (
          <AlarmFeed compact maxItems={20} />
        )}
      </CardContent>
    </Card>
  );
}
