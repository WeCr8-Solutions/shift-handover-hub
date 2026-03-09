import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDisposition, formatAuthStatus } from "@/lib/ncrUtils";
import { NCRReport } from "@/hooks/useNCR";
import { format } from "date-fns";
import {
  AlertTriangle, CheckCircle2, XCircle, Loader2, Clock, FileText, ImageIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getSignedUrls } from "@/lib/storageUtils";

interface NCRApprovalPanelProps {
  ncrs: NCRReport[];
  onApprove: (ncrId: string) => Promise<{ error: string | null }>;
  onReject: (ncrId: string, reason: string) => Promise<{ error: string | null }>;
}

export function NCRApprovalPanel({ ncrs, onApprove, onReject }: NCRApprovalPanelProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ ncrId: string; ncr: NCRReport } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingNcrs = ncrs.filter((n) => n.authorization_status === "pending");

  const handleApprove = async (ncrId: string) => {
    setActionLoading(ncrId);
    const { error } = await onApprove(ncrId);
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "NCR Approved", description: "Disposition effects applied" });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    setActionLoading(rejectDialog.ncrId);
    const { error } = await onReject(rejectDialog.ncrId, rejectReason);
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "NCR Rejected" });
      setRejectDialog(null);
      setRejectReason("");
    }
  };

  function NCRImageThumbnails({ imagePaths }: { imagePaths: string[] }) {
    const [urls, setUrls] = useState<string[]>([]);
    useEffect(() => {
      getSignedUrls("ncr-attachments", imagePaths).then(setUrls);
    }, [imagePaths]);
    if (!urls.length) return null;
    return (
      <div>
        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <ImageIcon className="w-3 h-3" /> Defect Photos ({urls.length})
        </span>
        <div className="flex gap-2 flex-wrap">
          {urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt={`Defect ${i + 1}`} className="w-14 h-14 rounded border border-border object-cover hover:ring-2 ring-primary transition-all" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (pendingNcrs.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">No pending NCRs requiring approval</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pendingNcrs.map((ncr) => {
          const disp = formatDisposition(ncr.disposition);
          return (
            <Card key={ncr.id} className="border-amber-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {ncr.ncr_number}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={disp.color}>{disp.label}</Badge>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Work Order</span>
                    <span className="font-medium">{ncr.work_order_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Serial/Lot</span>
                    <span className="font-medium">{ncr.serial_or_lot}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Operation</span>
                    <span className="font-medium">{ncr.operation_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Qty Affected</span>
                    <span className="font-medium">{ncr.quantity_affected}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Defect</span>
                  <span className="text-sm">{ncr.defect_type}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Description</span>
                  <p className="text-sm">{ncr.description}</p>
                </div>

                {/* Attached Images */}
                {ncr.image_urls && ncr.image_urls.length > 0 && (
                  <NCRImageThumbnails imagePaths={ncr.image_urls} />
                )}

                {ncr.disposition === "scrap" && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Approving will permanently scrap {ncr.quantity_affected} part(s)
                  </div>
                )}

                {ncr.disposition === "rework" && (
                  <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Approving will create a rework child work order
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(ncr.id)}
                    disabled={actionLoading === ncr.id}
                    className="gap-2"
                    size="sm"
                  >
                    {actionLoading === ncr.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectDialog({ ncrId: ncr.id, ncr })}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reject NCR</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {rejectDialog?.ncr.ncr_number}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading === rejectDialog?.ncrId}
            >
              {actionLoading === rejectDialog?.ncrId && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject NCR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
