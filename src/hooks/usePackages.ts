import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export type PackageStatus =
  | "draft"
  | "in_progress"
  | "ready_to_ship"
  | "shipped"
  | "closed"
  | "cancelled";

export interface WorkOrderPackage {
  id: string;
  organization_id: string;
  customer_id: string | null;
  package_number: string;
  title: string;
  description: string | null;
  notes: string | null;
  required_ship_date: string | null;
  promised_ship_date: string | null;
  actual_ship_date: string | null;
  status: PackageStatus;
  priority: string;
  is_quote: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageInput {
  title: string;
  customer_id?: string | null;
  description?: string | null;
  notes?: string | null;
  required_ship_date?: string | null;
  priority?: string;
  is_quote?: boolean;
}

const sb = supabase as any;

export function usePackages(opts?: { includeClosed?: boolean }) {
  const { organization } = useOrgContext();
  const { user } = useAuth();
  const [packages, setPackages] = useState<WorkOrderPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const includeClosed = opts?.includeClosed ?? false;

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    let q = sb
      .from("work_order_packages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("required_ship_date", { ascending: true, nullsFirst: false });
    if (!includeClosed) q = q.not("status", "in", "(shipped,closed,cancelled)");
    const { data, error } = await q;
    if (!error) setPackages((data as WorkOrderPackage[]) ?? []);
    setLoading(false);
  }, [organization?.id, includeClosed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPackage = useCallback(
    async (input: PackageInput) => {
      if (!organization?.id || !user) return { error: "Not authenticated" };
      const title = input.title.trim();
      if (!title) return { error: "Title required" };
      const { data: pkgNum, error: numErr } = await sb.rpc("generate_next_package_number", {
        _organization_id: organization.id,
      });
      if (numErr) return { error: numErr.message };
      const { data, error } = await sb
        .from("work_order_packages")
        .insert({
          organization_id: organization.id,
          created_by: user.id,
          package_number: pkgNum,
          title,
          customer_id: input.customer_id ?? null,
          description: input.description ?? null,
          notes: input.notes ?? null,
          required_ship_date: input.required_ship_date ?? null,
          priority: input.priority ?? "normal",
          is_quote: input.is_quote ?? false,
        })
        .select("*")
        .single();
      if (error) return { error: error.message };
      setPackages((p) => [data as WorkOrderPackage, ...p]);
      return { data: data as WorkOrderPackage };
    },
    [organization?.id, user],
  );

  const updatePackage = useCallback(async (id: string, patch: Partial<PackageInput>) => {
    const { data, error } = await sb
      .from("work_order_packages")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    setPackages((p) => p.map((x) => (x.id === id ? (data as WorkOrderPackage) : x)));
    return { data: data as WorkOrderPackage };
  }, []);

  const addItems = useCallback(
    async (packageId: string, itemIds: string[]) => {
      const { error } = await sb.rpc("add_items_to_package", {
        _package_id: packageId,
        _item_ids: itemIds,
      });
      if (error) return { error: error.message };
      await refresh();
      return {};
    },
    [refresh],
  );

  const removeItem = useCallback(async (itemId: string) => {
    const { error } = await sb.from("queue_items").update({ package_id: null }).eq("id", itemId);
    if (error) return { error: error.message };
    return {};
  }, []);

  const cascadeDueDate = useCallback(
    async (packageId: string, newDate: string, cascade = true) => {
      const { error } = await sb.rpc("cascade_package_due_date", {
        _package_id: packageId,
        _new_date: newDate,
        _cascade: cascade,
      });
      if (error) return { error: error.message };
      await refresh();
      return {};
    },
    [refresh],
  );

  const markShipped = useCallback(
    async (packageId: string) => {
      const { error } = await sb.rpc("mark_package_shipped", { _package_id: packageId });
      if (error) return { error: error.message };
      await refresh();
      return {};
    },
    [refresh],
  );

  return {
    packages,
    loading,
    refresh,
    createPackage,
    updatePackage,
    addItems,
    removeItem,
    cascadeDueDate,
    markShipped,
  };
}

export function usePackage(packageId?: string) {
  const [pkg, setPkg] = useState<WorkOrderPackage | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!packageId) return;
    setLoading(true);
    const [{ data: p }, { data: its }] = await Promise.all([
      sb.from("work_order_packages").select("*").eq("id", packageId).maybeSingle(),
      sb
        .from("queue_items")
        .select("id,title,work_order,part_number,status,quantity,qty_completed,due_date,package_sequence")
        .eq("package_id", packageId)
        .order("package_sequence", { ascending: true, nullsFirst: false }),
    ]);
    setPkg((p as WorkOrderPackage) ?? null);
    setItems((its as any[]) ?? []);
    setLoading(false);
  }, [packageId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pkg, items, loading, refresh };
}
