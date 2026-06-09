import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2, Package as PackageIcon } from "lucide-react";
import { PackageStatusBadge } from "@/components/packages/PackageStatusBadge";
import type { WorkOrderPackage } from "@/hooks/usePackages";
import { format } from "date-fns";

interface Props {
  customerId: string;
  organizationId: string;
}

export function CustomerPackagesSection({ customerId, organizationId }: Props) {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<WorkOrderPackage[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("work_order_packages")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("customer_id", customerId)
        .order("required_ship_date", { ascending: true, nullsFirst: false })
        .limit(25);
      if (cancelled) return;
      setPackages((data as WorkOrderPackage[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, organizationId]);

  return (
    <section>
      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
        <PackageIcon className="w-4 h-4" /> Packages
      </h4>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </div>
      ) : packages.length === 0 ? (
        <p className="text-xs text-muted-foreground">No packages for this customer.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {packages.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <Link to={`/packages/${p.id}`} className="font-mono truncate hover:underline">
                {p.package_number}
                <span className="ml-2 font-sans text-xs text-muted-foreground truncate">
                  {p.title}
                </span>
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                {p.required_ship_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(p.required_ship_date), "MMM d")}
                  </span>
                )}
                <PackageStatusBadge status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
