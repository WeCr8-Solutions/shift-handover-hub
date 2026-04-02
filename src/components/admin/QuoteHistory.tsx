import { useState, useEffect } from "react";
import { useQuoteHistory, QuoteWithLinkedData } from "@/hooks/useQuoteHistory";
import { exportQuotesToExcel, exportQuotesToQuickBooksCSV } from "@/lib/quoteExport";
import { downloadBlob } from "@/lib/workOrderExport";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Download,
  FileSpreadsheet,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Loader2,
  ChevronRight,
  FileQuestion,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuoteHistory() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithLinkedData | null>(null);
  const [exporting, setExporting] = useState(false);

  const { quotes, loading } = useQuoteHistory({
    search: debouncedSearch,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExportExcel = async () => {
    if (quotes.length === 0) {
      toast.error("No quotes to export");
      return;
    }
    setExporting(true);
    try {
      const blob = await exportQuotesToExcel(quotes);
      downloadBlob(blob, `quote-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel export downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export");
    }
    setExporting(false);
  };

  const handleExportQuickBooks = () => {
    if (quotes.length === 0) {
      toast.error("No quotes to export");
      return;
    }
    const blob = exportQuotesToQuickBooksCSV(quotes);
    downloadBlob(blob, `quotes-quickbooks-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("QuickBooks CSV exported");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <FileQuestion className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5" />
                Quote History
              </CardTitle>
              <CardDescription>
                Search and export completed quotes for accounting and record keeping
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exporting || quotes.length === 0}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportQuickBooks}
                disabled={quotes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                QuickBooks CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by quote number, part number, or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <Label className="sr-only">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex-1 sm:flex-none">
                <Label className="sr-only">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No completed quotes found</p>
                <p className="text-sm mt-1">Try adjusting your search or date filters</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer flex items-center gap-4 transition-colors"
                      onClick={() => setSelectedQuote(q)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        {getStatusIcon(q.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{q.work_order || q.title}</span>
                          <Badge variant="outline" className={getStatusColor(q.status)}>
                            {q.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {q.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          {q.part_number && <span>Part: {q.part_number}</span>}
                          {q.station_name && <span>• {q.station_name}</span>}
                          {q.quantity && <span>• Qty: {q.quantity}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(q.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {quotes.length} quotes
          </p>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              {selectedQuote?.work_order || selectedQuote?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Quote #</p>
                  <p className="font-medium">{selectedQuote.work_order || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Part Number</p>
                  <p className="font-medium">{selectedQuote.part_number || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedQuote.status)}>
                    {selectedQuote.status}
                  </Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedQuote.quantity || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="font-medium capitalize">{selectedQuote.priority}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Station</p>
                  <p className="font-medium">{selectedQuote.station_name || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-medium">{selectedQuote.team_name || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedQuote.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {selectedQuote.completed_at
                      ? format(new Date(selectedQuote.completed_at), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {selectedQuote.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedQuote.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
