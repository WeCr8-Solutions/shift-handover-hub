import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NCRReport } from "@/hooks/useNCR";
import { formatDisposition, formatAuthStatus } from "@/lib/ncrUtils";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";

interface NCRListViewProps {
  ncrs: NCRReport[];
  onSelect?: (ncr: NCRReport) => void;
}

export function NCRListView({ ncrs, onSelect }: NCRListViewProps) {
  if (ncrs.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">No NCR reports found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NCR #</TableHead>
            <TableHead>Work Order</TableHead>
            <TableHead>Defect</TableHead>
            <TableHead>Disposition</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ncrs.map((ncr) => {
            const disp = formatDisposition(ncr.disposition);
            const status = formatAuthStatus(ncr.authorization_status);
            return (
              <TableRow
                key={ncr.id}
                className={onSelect ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onSelect?.(ncr)}
              >
                <TableCell className="font-medium">{ncr.ncr_number}</TableCell>
                <TableCell>{ncr.work_order_number}</TableCell>
                <TableCell className="max-w-[150px] truncate">{ncr.defect_type}</TableCell>
                <TableCell>
                  <Badge variant={disp.color} className="text-xs">{disp.label}</Badge>
                </TableCell>
                <TableCell>{ncr.quantity_affected}</TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ncr.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
