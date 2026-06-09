import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CustomerPackagesSection } from "./CustomerPackagesSection";

interface Props {
  customerId: string;
  organizationId: string;
}

interface PartRow {
  id: string;
  part_number: string;
  description: string | null;
  default_quantity: number | null;
}

interface QueueItemRow {
  id: string;
  work_order_id: string | null;
  part_number: string | null;
  quantity: number | null;
  status: string | null;
  due_date: string | null;
  item_type: string | null;
}

export function CustomerRowExpand({ customerId, organizationId }: Props) {
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [items, setItems] = useState<QueueItemRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [partsRes, itemsRes] = await Promise.all([
        (supabase as any)
          .from("part_catalog")
          .select("id, part_number, description, default_quantity")
          .eq("organization_id", organizationId)
          .eq("customer_id", customerId)
          .order("part_number")
          .limit(50),
        (supabase as any)
          .from("queue_items")
          .select("id, work_order_id, part_number, quantity, status, due_date, item_type")
          .eq("organization_id", organizationId)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      setParts((partsRes.data as PartRow[]) || []);
      setItems((itemsRes.data as QueueItemRow[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, organizationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading customer history…
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 py-3">
      <section>
        <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
          <Package className="w-4 h-4" /> Parts
        </h4>
        {parts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No parts linked to this customer yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {parts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="font-mono truncate">{p.part_number}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {p.description || "—"}
                  {p.default_quantity ? ` • qty ${p.default_quantity}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
          <FileText className="w-4 h-4" /> Recent work orders & quotes
        </h4>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent jobs for this customer.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {items.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2">
                <Link
                  to={q.item_type === "quote" ? `/quotes` : `/work-orders/${q.id}/traveler`}
                  className="font-mono truncate hover:underline"
                >
                  {q.work_order_id || q.part_number || q.id.slice(0, 8)}
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {q.item_type || "wo"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{q.status || "—"}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <CustomerPackagesSection customerId={customerId} organizationId={organizationId} />
    </div>
  );
}
