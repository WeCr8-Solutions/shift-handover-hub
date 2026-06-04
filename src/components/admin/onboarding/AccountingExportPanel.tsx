import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Format = "qbo_csv" | "qb_iif" | "generic_csv";

const FORMAT_LABELS: Record<Format, string> = {
  qbo_csv: "QuickBooks Online (CSV)",
  qb_iif: "QuickBooks Desktop (IIF)",
  generic_csv: "Generic CSV (Xero, Wave, FreshBooks…)",
};

export interface AccountingExportPanelProps {
  /** When set, exports only this single engagement. Otherwise uses the date range. */
  engagementId?: string;
  lastExportedAt?: string | null;
}

export function AccountingExportPanel({ engagementId, lastExportedAt }: AccountingExportPanelProps) {
  const [format, setFormat] = useState<Format>("qbo_csv");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const body: Record<string, unknown> = { format };
      if (engagementId) {
        body.engagement_ids = [engagementId];
      } else {
        body.date_from = new Date(dateFrom + "T00:00:00").toISOString();
        body.date_to   = new Date(dateTo   + "T23:59:59").toISOString();
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/concierge-accounting-export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Export failed (${res.status})`);
      }
      const count = res.headers.get("X-Row-Count") ?? "0";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `concierge-export-${today}.${format === "qb_iif" ? "iif" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} engagement${count === "1" ? "" : "s"}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="w-4 h-4" /> Accounting export
          {lastExportedAt && (
            <Badge variant="outline" className="text-xs">
              Last exported {new Date(lastExportedAt).toLocaleDateString()}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {engagementId
            ? "Export this engagement as a single line item."
            : "Export all paid concierge engagements in a date range."}
          {" "}Only engagements with payment_status=paid are included.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div className={engagementId ? "md:col-span-3" : ""}>
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FORMAT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!engagementId && (
            <>
              <div>
                <Label className="text-xs">Paid from</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Paid to</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <Button onClick={download} disabled={downloading} className="gap-2 w-full md:w-auto">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
