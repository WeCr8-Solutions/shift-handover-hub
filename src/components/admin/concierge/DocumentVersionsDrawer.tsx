import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck, History } from "lucide-react";
import { useConciergeDocumentRecords } from "@/hooks/useConciergeDocumentRecords";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  engagementId: string | null;
  documentKey: string;
  documentTitle: string;
}

export function DocumentVersionsDrawer({ open, onOpenChange, engagementId, documentKey, documentTitle }: Props) {
  const { list, downloadVersion } = useConciergeDocumentRecords(engagementId, documentKey);

  const handleDownload = async (id: string) => {
    const record = list.data?.find((r) => r.id === id);
    if (!record) return;
    const url = await downloadVersion(record);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><History className="w-4 h-4" /> {documentTitle} — versions</SheetTitle>
          <SheetDescription>
            Every saved snapshot includes the needs + cost arrangement at save-time. Master copies are
            immutable; saving a new master supersedes the prior one but keeps it for audit.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2 max-h-[80vh] overflow-auto pr-1">
          {list.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!list.isLoading && (list.data?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground border rounded p-4 text-center">
              No versions saved yet. Use "Save version" on the document card.
            </div>
          )}
          {list.data?.map((r) => (
            <div key={r.id} className="border rounded p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-medium">v{r.version} · {r.format.toUpperCase()}</div>
                <div className="flex items-center gap-2">
                  {r.is_master && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                      <ShieldCheck className="w-3 h-3" /> Master
                    </Badge>
                  )}
                  {r.superseded_at && <Badge variant="outline">Superseded</Badge>}
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleDownload(r.id)}>
                    <Download className="w-3 h-3" /> Open
                  </Button>
                </div>
              </div>
              <div className="text-muted-foreground">Saved {new Date(r.created_at).toLocaleString()}</div>
              {r.notes && <div className="text-muted-foreground italic">{r.notes}</div>}
              {(r.cost_snapshot as any)?.monthlyTotal != null && (
                <div className="text-muted-foreground">
                  Cost: ${(r.cost_snapshot as any).monthlyTotal}/mo · ${(r.cost_snapshot as any).annualTotal?.toLocaleString?.()}/yr
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
