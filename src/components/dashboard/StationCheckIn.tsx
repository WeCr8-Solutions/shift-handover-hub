import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStations, Station } from "@/hooks/useStations";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { getCurrentShift } from "@/lib/mockData";
import { workCenterIcons, workCenterColors, getCategoryForType } from "@/lib/workCenterIcons";
import { WorkCenterType } from "@/types/handoff";
import { LogIn, Clock, MapPin, Loader2, Circle, Search, X, CheckSquare, Square } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface StationCheckInProps {
  onCheckIn: (stationIds: string[], shift: string) => Promise<any>;
}

export function StationCheckIn({ onCheckIn }: StationCheckInProps) {
  const { organization } = useUserOrganization();
  const { stations, loading: stationsLoading } = useStations(null, organization?.id);
  const [selectedStations, setSelectedStations] = useState<Set<string>>(new Set());
  const [shift, setShift] = useState<string>(getCurrentShift());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeStations = useMemo(() => stations.filter((s) => s.is_active), [stations]);

  // Filter stations by search query
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return activeStations;
    const query = searchQuery.toLowerCase();
    return activeStations.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.station_id.toLowerCase().includes(query) ||
        s.work_center_type?.toLowerCase().includes(query),
    );
  }, [activeStations, searchQuery]);

  // Group filtered stations by category (sorted alphabetically)
  const grouped = useMemo(() => {
    const map = new Map<string, Station[]>();
    filteredStations.forEach((s) => {
      const cat = getCategoryForType(s.work_center_type);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    // Sort categories alphabetically
    return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [filteredStations]);

  const toggleStation = useCallback((id: string) => {
    setSelectedStations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedStations(new Set(filteredStations.map((s) => s.id)));
  }, [filteredStations]);

  const clearAll = useCallback(() => {
    setSelectedStations(new Set());
  }, []);

  const handleStartShift = async () => {
    if (selectedStations.size === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await onCheckIn(Array.from(selectedStations), shift);
      toast.success(`Checked in to ${selectedStations.size} station${selectedStations.size !== 1 ? "s" : ""}`);
    } catch (err) {
      console.error("Check-in error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start shift. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStationKeyDown = (e: React.KeyboardEvent, stationId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleStation(stationId);
    }
  };

  if (stationsLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading stations">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allFilteredSelected = filteredStations.length > 0 && filteredStations.every((s) => selectedStations.has(s.id));
  const someSelected = selectedStations.size > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Start Your Shift</h1>
        <p className="text-muted-foreground">Select the station(s) you'll be working at today</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-auto p-1">
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Shift selector */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Shift:</span>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Swing">Swing</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="ml-auto">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </Badge>
        </CardContent>
      </Card>

      {/* Search and Select All controls */}
      {activeStations.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search stations"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Select All / Clear buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={allFilteredSelected ? clearAll : selectAll}
              className="gap-2"
              disabled={filteredStations.length === 0}
            >
              {allFilteredSelected ? (
                <>
                  <Square className="w-4 h-4" />
                  Clear All
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Select All {filteredStations.length !== activeStations.length && `(${filteredStations.length})`}
                </>
              )}
            </Button>
            {someSelected && !allFilteredSelected && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2">
                <X className="w-4 h-4" />
                Clear ({selectedStations.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Station groups */}
      {Array.from(grouped.entries()).map(([category, categoryStations]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {category}
            <span className="ml-2 text-xs font-normal">({categoryStations.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStations.map((station) => {
              const isSelected = selectedStations.has(station.id);
              const Icon = workCenterIcons[station.work_center_type as WorkCenterType] || Circle;
              const iconColor = workCenterColors[station.work_center_type as WorkCenterType];

              return (
                <Card
                  key={station.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/40"
                  }`}
                  onClick={() => toggleStation(station.id)}
                  onKeyDown={(e) => handleStationKeyDown(e, station.id)}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`${station.name} - ${station.work_center_type}`}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleStation(station.id)}
                      className="pointer-events-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{station.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {station.work_center_type} • {station.station_id}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* No results from search */}
      {searchQuery && filteredStations.length === 0 && activeStations.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-base mb-1">No matching stations</h3>
            <p className="text-muted-foreground text-sm mb-3">No stations match "{searchQuery}"</p>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No stations at all */}
      {activeStations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No stations available</h3>
            <p className="text-muted-foreground text-sm">Ask your supervisor to assign stations to your team.</p>
          </CardContent>
        </Card>
      )}

      {/* Start shift button */}
      {activeStations.length > 0 && (
        <div className="flex justify-center pt-2 pb-8">
          <Button
            size="lg"
            className="gap-2 px-8"
            disabled={selectedStations.size === 0 || submitting}
            onClick={handleStartShift}
            aria-label={
              submitting
                ? "Starting shift..."
                : `Start shift at ${selectedStations.size} station${selectedStations.size !== 1 ? "s" : ""}`
            }
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Start Shift ({selectedStations.size} station{selectedStations.size !== 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </div>
  );
}
