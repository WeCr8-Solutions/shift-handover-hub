import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AccountingExportPanel } from "@/components/admin/onboarding/AccountingExportPanel";

interface SalesRow {
  sales_rep_id: string;
  engagement_count: number;
  paid_count: number;
  outstanding_count: number;
  refunded_count: number;
  paid_cents: number;
  outstanding_cents: number;
  refunded_cents: number;
}
interface AgingRow {
  id: string;
  organization_id: string;
  organization_name: string;
  invoice_number: string | null;
  payment_status: string;
  payment_amount_cents: number;
  started_at: string;
  age_days: number;
  age_bucket: string;
}

export default function ConciergeReporting() {
  const sales = useQuery({
    queryKey: ["concierge-sales-performance"],
    queryFn: async (): Promise<SalesRow[]> => {
      const { data, error } = await supabase.from("concierge_sales_performance" as any).select("*");
      if (error) throw error;
      return (data ?? []) as unknown as SalesRow[];
    },
  });
  const aging = useQuery({
    queryKey: ["concierge-payment-aging"],
    queryFn: async (): Promise<AgingRow[]> => {
      const { data, error } = await supabase.from("concierge_payment_aging" as any)
        .select("*").order("age_days", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AgingRow[];
    },
  });

  const fmt = (c: number) => `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Helmet><title>Concierge Reporting · JobLine.ai</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <header>
        <h1 className="text-2xl font-bold">Concierge reporting</h1>
        <p className="text-sm text-muted-foreground">Sales performance, payment aging, and accounting exports.</p>
      </header>

      <AccountingExportPanel />

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales" className="gap-2"><TrendingUp className="w-4 h-4" /> Sales performance</TabsTrigger>
          <TabsTrigger value="aging" className="gap-2"><AlertTriangle className="w-4 h-4" /> Payment aging</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales rep performance</CardTitle>
              <CardDescription>One row per sales rep (or engagement creator if unassigned).</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
               !sales.data || sales.data.length === 0 ? <div className="text-sm text-muted-foreground">No data.</div> :
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rep</TableHead>
                    <TableHead className="text-right">Engagements</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead className="text-right">Paid $</TableHead>
                    <TableHead className="text-right">Outstanding $</TableHead>
                    <TableHead className="text-right">Refunded $</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.data.map((r) => (
                    <TableRow key={r.sales_rep_id ?? "unassigned"}>
                      <TableCell className="font-mono text-xs">{r.sales_rep_id?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell className="text-right">{r.engagement_count}</TableCell>
                      <TableCell className="text-right">{r.paid_count}</TableCell>
                      <TableCell className="text-right">{r.outstanding_count}</TableCell>
                      <TableCell className="text-right">{r.refunded_count}</TableCell>
                      <TableCell className="text-right">{fmt(r.paid_cents)}</TableCell>
                      <TableCell className="text-right">{fmt(r.outstanding_cents)}</TableCell>
                      <TableCell className="text-right text-destructive">{fmt(r.refunded_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outstanding payments</CardTitle>
              <CardDescription>Engagements with unpaid or invoiced status.</CardDescription>
            </CardHeader>
            <CardContent>
              {aging.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
               !aging.data || aging.data.length === 0 ? <div className="text-sm text-muted-foreground">No outstanding invoices.</div> :
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Org</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                    <TableHead>Bucket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aging.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.invoice_number ?? r.id.slice(0, 8)}</TableCell>
                      <TableCell>{r.organization_name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.payment_status}</Badge></TableCell>
                      <TableCell className="text-right">{fmt(r.payment_amount_cents)}</TableCell>
                      <TableCell className="text-right">{r.age_days}d</TableCell>
                      <TableCell>
                        <Badge variant={r.age_bucket === "90+" ? "destructive" : r.age_bucket === "61-90" ? "secondary" : "outline"}>
                          {r.age_bucket}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
