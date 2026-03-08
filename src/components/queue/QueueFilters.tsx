import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueStatus, QueueItemType } from "@/hooks/useQueue";
import { useQuoteSystem } from "@/hooks/useQuoteSystem";
import { X, Wrench } from "lucide-react";

interface StationOption {
  id: string;
  name: string;
  station_id: string;
}

interface QueueFiltersProps {
  filters: {
    status?: QueueStatus[];
    item_type?: QueueItemType[];
    station_id?: string;
    assigned_to?: string;
  };
  onFiltersChange: (filters: QueueFiltersProps["filters"]) => void;
  showStationFilter?: boolean;
  stations?: StationOption[];
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ALL_TYPE_OPTIONS: { value: QueueItemType; label: string }[] = [
  { value: "quote", label: "Quote" },
  { value: "work_order", label: "Work Order" },
  { value: "station_task", label: "Station Task" },
  { value: "team_task", label: "Team Task" },
  { value: "support_ticket", label: "Support Ticket" },
];

export function QueueFilters({ filters, onFiltersChange, showStationFilter, stations = [] }: QueueFiltersProps) {
  const { isQuoteSystemEnabled } = useQuoteSystem();
  const typeOptions = isQuoteSystemEnabled
    ? ALL_TYPE_OPTIONS
    : ALL_TYPE_OPTIONS.filter(o => o.value !== "quote");
  const activeFilters = [
    ...(filters.status || []).map((s) => ({ type: "status" as const, value: s })),
    ...(filters.item_type || []).map((t) => ({ type: "item_type" as const, value: t })),
  ];

  const removeFilter = (type: "status" | "item_type", value: string) => {
    if (type === "status") {
      onFiltersChange({
        ...filters,
        status: filters.status?.filter((s) => s !== value),
      });
    } else {
      onFiltersChange({
        ...filters,
        item_type: filters.item_type?.filter((t) => t !== value),
      });
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value=""
        onValueChange={(value) => {
          const currentStatus = filters.status || [];
          if (!currentStatus.includes(value as QueueStatus)) {
            onFiltersChange({
              ...filters,
              status: [...currentStatus, value as QueueStatus],
            });
          }
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Add status..." />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value=""
        onValueChange={(value) => {
          const currentTypes = filters.item_type || [];
          if (!currentTypes.includes(value as QueueItemType)) {
            onFiltersChange({
              ...filters,
              item_type: [...currentTypes, value as QueueItemType],
            });
          }
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Add type..." />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showStationFilter && stations.length > 0 && (
        <Select
          value={filters.station_id || ""}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              station_id: value || undefined,
            });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Select station..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {stations.map((station) => (
              <SelectItem key={station.id} value={station.id}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}


        <>
          <div className="h-6 w-px bg-border" />
          {activeFilters.map((filter, index) => (
            <Badge key={`${filter.type}-${filter.value}-${index}`} variant="secondary" className="gap-1">
              {filter.value.replace("_", " ")}
              <button onClick={() => removeFilter(filter.type, filter.value)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </>
      )}
    </div>
  );
}
