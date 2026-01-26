import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueItem, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface QueueCalendarViewProps {
  items: QueueItem[];
  onItemClick: (itemId: string) => void;
}

type ViewMode = "week" | "month";

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

function QueueItemCard({ item, onClick }: { item: QueueItem; onClick: () => void }) {
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-2 bg-card rounded border-l-4 shadow-sm cursor-pointer transition-all hover:shadow-md text-xs",
        getStatusColor(item.status),
        isOverdue && "bg-red-50 dark:bg-red-900/10"
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <Badge className={cn("text-[10px] px-1 py-0", getPriorityColor(item.priority))}>
          {item.priority}
        </Badge>
      </div>
      <p className="font-medium truncate">{item.title}</p>
      {item.work_order && (
        <p className="text-muted-foreground truncate">WO: {item.work_order}</p>
      )}
    </div>
  );
}

export function QueueCalendarView({ items, onItemClick }: QueueCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getItemsForDate = (date: Date) => {
    return items.filter((item) => {
      if (!item.due_date) return false;
      return isSameDay(new Date(item.due_date), date);
    });
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

  // Items without due dates
  const unscheduledItems = items.filter((item) => !item.due_date && item.status !== "completed");

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
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
          <h2 className="text-lg font-semibold ml-2">
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
            // Week View
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayItems = getItemsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <Card
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[300px] cursor-pointer transition-colors",
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
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2">
                      <ScrollArea className="h-[220px]">
                        <div className="space-y-1">
                          {dayItems.map((item) => (
                            <QueueItemCard
                              key={item.id}
                              item={item}
                              onClick={() => onItemClick(item.id)}
                            />
                          ))}
                          {dayItems.length === 0 && (
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
          ) : (
            // Month View
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  className="pointer-events-auto w-full"
                  modifiers={{
                    hasItems: (date) => getItemsForDate(date).length > 0,
                  }}
                  modifiersStyles={{
                    hasItems: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                    },
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dayItems = getItemsForDate(date);
                      return (
                        <div className="relative w-full h-full flex flex-col items-center">
                          <span>{date.getDate()}</span>
                          {dayItems.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {dayItems.slice(0, 3).map((item, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    item.priority === "critical" ? "bg-red-500" :
                                    item.priority === "urgent" ? "bg-orange-500" :
                                    item.priority === "high" ? "bg-yellow-500" :
                                    "bg-blue-500"
                                  )}
                                />
                              ))}
                              {dayItems.length > 3 && (
                                <span className="text-[8px] text-muted-foreground">+{dayItems.length - 3}</span>
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
