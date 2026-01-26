import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue, QueueStatus, QueueItemType } from "@/hooks/useQueue";
import { Header } from "@/components/Header";
import { QueueKanbanBoard } from "@/components/queue/QueueKanbanBoard";
import { QueueListView } from "@/components/queue/QueueListView";
import { QueueCalendarView } from "@/components/queue/QueueCalendarView";
import { QueueFilters } from "@/components/queue/QueueFilters";
import { CreateQueueItemDialog } from "@/components/queue/CreateQueueItemDialog";
import { QueueItemDetailDialog } from "@/components/queue/QueueItemDetailDialog";
import { QueueStatsCards } from "@/components/queue/QueueStatsCards";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, List, Plus, Calendar } from "lucide-react";

export default function Queue() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: QueueStatus[];
    item_type?: QueueItemType[];
    station_id?: string;
    assigned_to?: string;
  }>({});

  const {
    items,
    itemsByStatus,
    loading,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    addComment,
    getComments,
    getHistory,
  } = useQueue(filters);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending" || i.status === "queued").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
    completed: items.filter((i) => i.status === "completed").length,
    overdue: items.filter((i) => i.due_date && new Date(i.due_date) < new Date() && i.status !== "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Queue Management</h1>
            <p className="text-sm text-muted-foreground">
              Plan, prioritize, and track work orders, tasks, and support tickets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={view === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        <QueueStatsCards stats={stats} />

        {/* Filters */}
        <QueueFilters filters={filters} onFiltersChange={setFilters} />

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {view === "kanban" && (
              <QueueKanbanBoard
                itemsByStatus={itemsByStatus}
                onItemClick={setSelectedItemId}
                onStatusChange={(itemId, newStatus) => updateItem(itemId, { status: newStatus })}
                onReorder={reorderItems}
              />
            )}
            {view === "list" && (
              <QueueListView
                items={items}
                onItemClick={setSelectedItemId}
                onStatusChange={(itemId, newStatus) => updateItem(itemId, { status: newStatus })}
                onDelete={deleteItem}
              />
            )}
            {view === "calendar" && (
              <QueueCalendarView
                items={items}
                onItemClick={setSelectedItemId}
              />
            )}
          </>
        )}
      </main>

      {/* Create Dialog */}
      <CreateQueueItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createItem}
      />

      {/* Detail Dialog */}
      <QueueItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onAddComment={addComment}
        getComments={getComments}
        getHistory={getHistory}
      />
    </div>
  );
}
