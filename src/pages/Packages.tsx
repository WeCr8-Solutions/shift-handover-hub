import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Package as PackageIcon, Calendar, Boxes, Hammer } from "lucide-react";
import { usePackages } from "@/hooks/usePackages";
import { useCustomers } from "@/hooks/useCustomers";
import { useAdminAccess } from "@/hooks/useAdminData";
import { PackageStatusBadge } from "@/components/packages/PackageStatusBadge";
import { CreatePackageDialog } from "@/components/packages/CreatePackageDialog";
import { PackageBuilderDialog } from "@/components/packages/PackageBuilderDialog";
import { format } from "date-fns";

export default function Packages() {
  const { packages, loading, refresh } = usePackages({ includeClosed: false });
  const { customers } = useCustomers({ includeInactive: true });
  const { hasOrgSupervisorAccess } = useAdminAccess();
  const [createOpen, setCreateOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [search, setSearch] = useState("");

  const customerName = (id: string | null) =>
    id ? customers.find((c) => c.id === id)?.name ?? "—" : "—";

  const filtered = packages.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.package_number.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <Helmet>
        <title>Packages | JobLine.ai</title>
        <meta
          name="description"
          content="Group multiple work orders and quotes into a single ship date for assemblies and tooling builds."
        />
      </Helmet>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageIcon className="w-6 h-6" /> Packages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Converge multiple work orders into one shared ship date. Perfect for assemblies and
            tooling builds.
          </p>
        </div>
        {hasOrgSupervisorAccess && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(true)} data-testid="pkg-new-empty">
              <Plus className="w-4 h-4 mr-2" />
              Empty Package
            </Button>
            <Button onClick={() => setBuilderOpen(true)} data-testid="pkg-new-builder">
              <Hammer className="w-4 h-4 mr-2" />
              Build Package
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Boxes className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No packages yet. Create one to bundle work orders for a single delivery.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">
                  <Link to={`/packages/${p.id}`} className="hover:underline">
                    {p.package_number} — {p.title}
                  </Link>
                </CardTitle>
                <PackageStatusBadge status={p.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>Customer: {customerName(p.customer_id)}</span>
                {p.required_ship_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Ship by {format(new Date(p.required_ship_date), "MMM d, yyyy")}
                  </span>
                )}
                {p.is_quote && <span>Quote package</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreatePackageDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
