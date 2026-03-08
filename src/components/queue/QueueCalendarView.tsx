import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueItem, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Target, Play, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface QueueCalendarViewProps {
  items: QueueItem[];
  onItemClick: (itemId: string) => void;
}

type ViewMode = "week" | "month";
type DateType = "due" | "scheduled_start" | "scheduled_end" | "started" | "est_complete";

interface CalendarEntry {
  item: QueueItem;
  dateType: DateType;
  date: Date;
}

const DATE_TYPE_LABELS: Record<DateType, { label: string; icon: typeof CalendarIcon; className: string }> = {
  due: { label: "Due", icon: Target, className: "text-destructive" },
  scheduled_start: { label: "Sched. Start", icon: Play, className: "text-primary" },
  scheduled_end: { label: "Sched. End", icon: CheckCircle2, className: "text-green-600" },
  started: { label: "Started", icon: Play, className: "text-blue-500" },
  est_complete: { label: "Est. Complete", icon: Clock, className: "text-amber-500" },
};

function getEntriesForItems(items: QueueItem[]): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  for (const item of items) {
    if (item.due_date) {
      entries.push({ item, dateType: "due", date: new Date(item.due_date) });
    }
    if (item.scheduled_start) {
      entries.push({ item, dateType: "scheduled_start", date: new Date(item.scheduled_start) });
    }
    if (item.scheduled_end) {
      entries.push({ item, dateType: "scheduled_end", date: new Date(item.scheduled_end) });
    }
    if (item.started_at && item.status === "in_progress") {
      entries.push({ item, dateType: "started", date: new Date(item.started_at) });
    }
    // Estimated completion: started_at + estimated_duration
    if (item.started_at && item.estimated_duration && item.status === "in_progress") {
      const estComplete = addMinutes(new Date(item.started_at), item.estimated_duration);
      entries.push({ item, dateType: "est_complete", date: estComplete });
    }
  }
  return entries;
}

function getPriorityColor(priority: QueuePriority): string {
  switch (priority) {
    case "critical":
      return "bg-red-500 text-white";
    case "urgent":
      return "bg-orange-500 text-white";
    case "high":
      return "bg-yellow-500 text-white";
    case "normal":
      return "bg-blue-500 text-white";
    case "low":
      return "bg-gray-400 text-white";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "border-l-gray-400";
    case "queued":
      return "border-l-yellow-400";
    case "in_progress":
      return "border-l-blue-400";
    case "on_hold":
      return "border-l-orange-400";
    case "completed":
      return "border-l-green-400";
    default:
      return "border-l-gray-400";
  }
}

function CalendarEntryCard({ entry, onClick }: { entry: CalendarEntry; onClick: () => void }) {
  const { item, dateType } = entry;
  const isOverdue = dateType === "due" && item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";
  const meta = DATE_TYPE_LABELS[dateType];
  const Icon = meta.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={cn(
            "p-1.5 bg-card rounded border-l-4 shadow-sm cursor-pointer transition-all hover:shadow-md text-xs",
            getStatusColor(item.status),
            isOverdue && "bg-destructive/5"
          )}
        >
          <div className="flex items-center gap-1 mb-0.5">
            <Icon className={cn("w-3 h-3 shrink-0", meta.className)} />
            <span className={cn("text-[10px] font-medium", meta.className)}>{meta.label}</span>
            <Badge className={cn("text-[9px] px-1 py-0 ml-auto", getPriorityColor(item.priority))}>
              {item.priority}
            </Badge>
          </div>
          <p className="font-medium truncate">{item.title}</p>
          {item.work_order && (
            <p className="text-muted-foreground truncate">WO: {item.work_order}</p>
          )}
          {item.estimated_duration && dateType === "due" && (
            <p className="text-muted-foreground truncate">
              <Clock className="w-3 h-3 inline mr-0.5" />
              {Math.round(item.estimated_duration / 60)}h {item.estimated_duration % 60}m est.
            </p>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs max-w-[200px]">
        <p className="font-semibold">{item.title}</p>
        <p className="text-muted-foreground">{meta.label}: {format(entry.date, "PPp")}</p>
        {item.estimated_duration && <p>Est. duration: {Math.round(item.estimated_duration / 60)}h {item.estimated_duration % 60}m</p>}
        {item.part_number && <p>Part: {item.part_number}</p>}
        <p>Status: {item.status}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function QueueCalendarView({ items, onItemClick }: QueueCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Build all calendar entries from all date fields
  const allEntries = getEntriesForItems(items);

  const getEntriesForDate = (date: Date): CalendarEntry[] => {
    return allEntries.filter((e) => isSameDay(e.date, date));
  };

  // Capacity indicator: count estimated hours for a day
  const getDayLoad = (date: Date): number => {
    const dayEntries = getEntriesForDate(date);
    let totalMinutes = 0;
    const seen = new Set<string>();
    for (const e of dayEntries) {
      if (seen.has(e.item.id)) continue;
      seen.add(e.item.id);
      totalMinutes += e.item.estimated_duration || 0;
    }
    return totalMinutes;
  };

  const navigatePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Week view days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Items without any dates at all
  const unscheduledItems = items.filter((item) =>
    !item.due_date && !item.scheduled_start && !item.scheduled_end && item.status !== "completed"
  );

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold ml-2">
            {viewMode === "week"
              ? `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-3">
          {viewMode === "week" ? (
            // Week View — scrollable horizontal on mobile, full grid on desktop
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {weekDays.map((day) => {
                  const dayEntries = getEntriesForDate(day);
                  const dayLoad = getDayLoad(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <Card
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[200px] lg:min-h-[300px] cursor-pointer transition-colors",
                        isToday && "border-primary",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <CardHeader className="py-2 px-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(day, "EEE")}
                          </span>
                          <div className="flex items-center gap-1">
                            {dayLoad > 0 && (
                              <span className={cn(
                                "text-[9px] font-medium px-1 rounded",
                                dayLoad > 480 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                              )}>
                                {Math.round(dayLoad / 60)}h
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2">
                        <ScrollArea className="h-[140px] lg:h-[220px]">
                          <div className="space-y-1">
                            {dayEntries.map((entry, i) => (
                              <CalendarEntryCard
                                key={`${entry.item.id}-${entry.dateType}-${i}`}
                                entry={entry}
                                onClick={() => onItemClick(entry.item.id)}
                              />
                            ))}
                            {dayEntries.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                No items
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            // Month View — full-width calendar
            <Card>
              <CardContent className="p-2 sm:p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  className="pointer-events-auto w-full [&_table]:w-full [&_th]:w-auto [&_td]:w-auto [&_td]:p-1 [&_th]:p-1 [&_.rdp-cell]:text-center [&_.rdp-head_cell]:text-center [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 sm:[&_.rdp-day]:h-12 sm:[&_.rdp-day]:w-12"
                  modifiers={{
                    hasItems: (date) => getEntriesForDate(date).length > 0,
                  }}
                  modifiersStyles={{
                    hasItems: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                    },
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dayEntries = getEntriesForDate(date);
                      return (
                        <div className="relative w-full h-full flex flex-col items-center">
                          <span>{date.getDate()}</span>
                          {dayEntries.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {dayEntries.slice(0, 3).map((entry, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    entry.dateType === "due" ? "bg-destructive" :
                                    entry.dateType === "est_complete" ? "bg-amber-500" :
                                    "bg-primary"
                                  )}
                                />
                              ))}
                              {dayEntries.length > 3 && (
                                <span className="text-[8px] text-muted-foreground">+{dayEntries.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Selected Day Details & Unscheduled */}
        <div className="space-y-4">
          {/* Selected Day Items */}
          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedDate, "EEEE, MMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {getItemsForDate(selectedDate).map((item) => (
                      <QueueItemCard
                        key={item.id}
                        item={item}
                        onClick={() => onItemClick(item.id)}
                      />
                    ))}
                    {getItemsForDate(selectedDate).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No items scheduled
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Unscheduled Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Unscheduled ({unscheduledItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {unscheduledItems.slice(0, 10).map((item) => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onClick={() => onItemClick(item.id)}
                    />
                  ))}
                  {unscheduledItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All items scheduled
                    </p>
                  )}
                  {unscheduledItems.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{unscheduledItems.length - 10} more
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
