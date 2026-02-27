import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStations, Station } from "@/hooks/useStations";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { getCurrentShift } from "@/lib/mockData";
import { workCenterIcons, workCenterColors, getCategoryForType } from "@/lib/workCenterIcons";
import { WorkCenterType } from "@/types/handoff";
import { LogIn, Clock, MapPin, Loader2, Circle } from "lucide-react";

interface StationCheckInProps {
  onCheckIn: (stationIds: string[], shift: string) => Promise<any>;
}

export function StationCheckIn({ onCheckIn }: StationCheckInProps) {
  const { organization } = useUserOrganization();
  const { stations, loading: stationsLoading } = useStations(null, organization?.id);
  const [selectedStations, setSelectedStations] = useState<Set<string>>(new Set());
  const [shift, setShift] = useState<string>(getCurrentShift());
  const [submitting, setSubmitting] = useState(false);

  const activeStations = useMemo(
    () => stations.filter((s) => s.is_active),
    [stations]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Station[]>();
    activeStations.forEach((s) => {
      const cat = getCategoryForType(s.work_center_type);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return map;
  }, [activeStations]);

  const toggleStation = (id: string) => {
    setSelectedStations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartShift = async () => {
    if (selectedStations.size === 0) return;
    setSubmitting(true);
    await onCheckIn(Array.from(selectedStations), shift);
    setSubmitting(false);
  };

  if (stationsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Start Your Shift</h1>
        <p className="text-muted-foreground">
          Select the station(s) you'll be working at today
        </p>
      </div>

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

      {/* Station groups */}
      {Array.from(grouped.entries()).map(([category, categoryStations]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {category}
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
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  }`}
                  onClick={() => toggleStation(station.id)}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleStation(station.id)}
                      className="pointer-events-none"
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

      {activeStations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No stations available</h3>
            <p className="text-muted-foreground text-sm">
              Ask your supervisor to assign stations to your team.
            </p>
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
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            Start Shift ({selectedStations.size} station{selectedStations.size !== 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </div>
  );
}
