import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { usePackage, usePackages } from "@/hooks/usePackages";
import { useCustomers } from "@/hooks/useCustomers";
import { useAdminAccess } from "@/hooks/useAdminData";
import { PackageStatusBadge } from "@/components/packages/PackageStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const sb = supabase as any;

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const { pkg, items, loading, refresh } = usePackage(id);
  const { cascadeDueDate, markShipped, removeItem, updatePackage, approveQuotePackage } =
    usePackages({ includeClosed: true });
  const { customers } = useCustomers({ includeInactive: true });
  const { hasOrgSupervisorAccess } = useAdminAccess();
  const [newShip, setNewShip] = useState("");
  const [promisedShip, setPromisedShip] = useState("");
  const [approving, setApproving] = useState(false);
  const [savingChildDate, setSavingChildDate] = useState<string | null>(null);

  if (loading || !pkg) {
    return <div className="container mx-auto py-6 px-4">Loading…</div>;
  }

  const customer = customers.find((c) => c.id === pkg.customer_id);
  const done = items.filter((i) => i.status === "completed").length;
  const cancelled = items.filter((i) => i.status === "cancelled").length;
  const total = items.length;

  const onCascade = async () => {
    if (!newShip) return;
    const res = await cascadeDueDate(pkg.id, newShip, true);
    if (res.error) return toast.error(res.error);
    toast.success("Ship date updated and cascaded to all open children");
    setNewShip("");
    refresh();
  };

  const onPromisedShipSave = async () => {
    if (!promisedShip) return;
    const res = await updatePackage(pkg.id, { promised_ship_date: promisedShip } as any);
    if (res.error) return toast.error(res.error);
    toast.success("Promised ship date saved");
    setPromisedShip("");
    refresh();
  };

  const onShip = async () => {
    const res = await markShipped(pkg.id);
    if (res.error) return toast.error(res.error);
    toast.success("Package marked as shipped");
    refresh();
  };

  const onApproveQuotePackage = async () => {
    setApproving(true);
    const res = await approveQuotePackage(pkg.id);
    setApproving(false);
    if (res.error) return toast.error(res.error);
    toast.success(`Converted ${res.count} quote${res.count === 1 ? "" : "s"} into work orders`);
    refresh();
  };

  const onUnlink = async (itemId: string) => {
    const res = await removeItem(itemId);
    if (res.error) return toast.error(res.error);
    refresh();
  };

  const onUpdateChildDate = async (itemId: string, value: string) => {
    if (!value) return;
    if (pkg.required_ship_date && value > pkg.required_ship_date) {
      toast.warning("Child due date is after package ship date — sub-assemblies usually finish earlier.");
    }
    setSavingChildDate(itemId);
    const { error } = await sb
      .from("queue_items")
      .update({ due_date: new Date(value).toISOString() })
      .eq("id", itemId);
    setSavingChildDate(null);
    if (error) return toast.error(error.message);
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

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{pkg.package_number}</h1>
            <PackageStatusBadge status={pkg.status} />
            {pkg.is_quote && <Badge variant="outline">Quote Package</Badge>}
          </div>
          <p className="text-lg mt-1">{pkg.title}</p>
          {customer && (
            <p className="text-sm text-muted-foreground mt-1">
              Customer:{" "}
              <Link to="/customers" className="hover:underline">
                {customer.name}
              </Link>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasOrgSupervisorAccess && pkg.is_quote && (
            <Button onClick={onApproveQuotePackage} disabled={approving} data-testid="pkg-approve-quote">
              {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve &amp; Convert All
            </Button>
          )}
          {hasOrgSupervisorAccess && pkg.status === "ready_to_ship" && (
            <Button onClick={onShip} data-testid="pkg-ship">
              <Truck className="w-4 h-4 mr-2" /> Mark Shipped
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm text-muted-foreground">Promised ship date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {pkg.promised_ship_date
                ? format(new Date(pkg.promised_ship_date), "MMM d, yyyy")
                : "—"}
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
            <CardTitle className="text-sm text-muted-foreground">Actual ship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {pkg.actual_ship_date ? format(new Date(pkg.actual_ship_date), "MMM d, yyyy") : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {hasOrgSupervisorAccess && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Cascade Required Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>New required ship date</Label>
                  <Input type="date" value={newShip} onChange={(e) => setNewShip(e.target.value)} />
                </div>
                <Button onClick={onCascade} disabled={!newShip}>
                  Apply to all
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All open child work orders get this due date.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promised Ship Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Date promised to customer</Label>
                  <Input
                    type="date"
                    value={promisedShip}
                    onChange={(e) => setPromisedShip(e.target.value)}
                  />
                </div>
                <Button onClick={onPromisedShipSave} disabled={!promisedShip}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Child Work Orders ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No work orders yet. Use "Build Package" or "Add to Package" from the queue.
            </p>
          )}
          <div className="divide-y">
            {items.map((it) => (
              <div
                key={it.id}
                className="py-3 flex items-center justify-between gap-3 flex-wrap"
                data-testid="pkg-child-row"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/work-orders/${it.id}/traveler`}
                    className="font-medium truncate hover:underline"
                  >
                    {it.work_order || it.title}
                    {it.part_number && (
                      <span className="text-sm text-muted-foreground ml-2">{it.part_number}</span>
                    )}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Seq {it.package_sequence ?? "—"} · {it.quantity ?? 0} qty ·{" "}
                    {it.qty_completed ?? 0} complete
                  </div>
                </div>
                <Badge variant="outline">{it.status}</Badge>
                {hasOrgSupervisorAccess && (
                  <Input
                    type="date"
                    className="w-[150px]"
                    defaultValue={it.due_date ? it.due_date.slice(0, 10) : ""}
                    onBlur={(e) => onUpdateChildDate(it.id, e.target.value)}
                    disabled={savingChildDate === it.id}
                  />
                )}
                {hasOrgSupervisorAccess && (
                  <Button size="sm" variant="ghost" onClick={() => onUnlink(it.id)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
