import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Calendar } from "lucide-react";
import { usePackage, usePackages } from "@/hooks/usePackages";
import { useCustomers } from "@/hooks/useCustomers";
import { PackageStatusBadge } from "@/components/packages/PackageStatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const { pkg, items, loading, refresh } = usePackage(id);
  const { cascadeDueDate, markShipped, removeItem } = usePackages({ includeClosed: true });
  const { customers } = useCustomers({ includeInactive: true });
  const [newDate, setNewDate] = useState("");

  if (loading || !pkg) {
    return <div className="container mx-auto py-6 px-4">Loading…</div>;
  }

  const customer = customers.find((c) => c.id === pkg.customer_id);
  const done = items.filter((i) => i.status === "completed").length;
  const cancelled = items.filter((i) => i.status === "cancelled").length;
  const total = items.length;

  const onCascade = async () => {
    if (!newDate || !pkg) return;
    const res = await cascadeDueDate(pkg.id, newDate, true);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Ship date updated and cascaded to all child work orders");
    setNewDate("");
    refresh();
  };

  const onShip = async () => {
    const res = await markShipped(pkg.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Package marked as shipped");
    refresh();
  };

  const onUnlink = async (itemId: string) => {
    const res = await removeItem(itemId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    refresh();
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <Helmet>
        <title>{pkg.package_number} — Package | JobLine.ai</title>
      </Helmet>

      <Link to="/packages" className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to packages
      </Link>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{pkg.package_number}</h1>
            <PackageStatusBadge status={pkg.status} />
          </div>
          <p className="text-lg mt-1">{pkg.title}</p>
          {customer && (
            <p className="text-sm text-muted-foreground mt-1">Customer: {customer.name}</p>
          )}
        </div>
        {pkg.status === "ready_to_ship" && (
          <Button onClick={onShip}>
            <Truck className="w-4 h-4 mr-2" /> Mark Shipped
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Required ship date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {pkg.required_ship_date
                ? format(new Date(pkg.required_ship_date), "MMM d, yyyy")
                : "Not set"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {done} / {total} complete
              {cancelled > 0 && (
                <span className="text-sm text-muted-foreground ml-2">({cancelled} cancelled)</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{pkg.is_quote ? "Quote Package" : "Work Order Package"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Cascade Ship Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>New required ship date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Button onClick={onCascade} disabled={!newDate}>
              Apply to all children
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All open child work orders will have their due date updated to match.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Child Work Orders ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No work orders yet. From the queue, use "Add to Package" on any work order or quote.
            </p>
          )}
          <div className="divide-y">
            {items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {it.work_order || it.title}
                    {it.part_number && (
                      <span className="text-sm text-muted-foreground ml-2">{it.part_number}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.quantity ?? 0} qty · {it.qty_completed ?? 0} complete
                    {it.due_date && ` · due ${format(new Date(it.due_date), "MMM d")}`}
                  </div>
                </div>
                <Badge variant="outline">{it.status}</Badge>
                <Button size="sm" variant="ghost" onClick={() => onUnlink(it.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
