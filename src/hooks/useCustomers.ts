import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
}

export type CustomerInput = {
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

function clean(input: CustomerInput) {
  return {
    name: input.name.trim(),
    contact_name: input.contact_name?.toString().trim() || null,
    contact_email: input.contact_email?.toString().trim().toLowerCase() || null,
    contact_phone: input.contact_phone?.toString().trim() || null,
    address: input.address?.toString().trim() || null,
    notes: input.notes?.toString().trim() || null,
    is_active: input.is_active ?? true,
  };
}

export function useCustomers(opts?: { includeInactive?: boolean }) {
  const { organization } = useOrgContext();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const includeInactive = opts?.includeInactive ?? false;

  const fetch = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    let query = (supabase as any)
      .from("customers")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name");
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (!error) setCustomers((data as Customer[]) || []);
    setLoading(false);
  }, [organization?.id, includeInactive]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createCustomer = useCallback(
    async (input: CustomerInput) => {
      if (!organization?.id || !user) return { error: "Not authenticated" };
      const payload = clean(input);
      if (!payload.name) return { error: "Name required" };
      const { data, error } = await (supabase as any)
        .from("customers")
        .insert({ ...payload, organization_id: organization.id, created_by: user.id })
        .select("*")
        .single();
      if (error) return { error: error.message };
      setCustomers((prev) => [...prev, data as Customer].sort((a, b) => a.name.localeCompare(b.name)));
      return { data: data as Customer };
    },
    [organization?.id, user],
  );

  const updateCustomer = useCallback(
    async (id: string, input: CustomerInput) => {
      const payload = clean(input);
      const { data, error } = await (supabase as any)
        .from("customers")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) return { error: error.message };
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? (data as Customer) : c)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      return { data: data as Customer };
    },
    [],
  );

  const deactivateCustomer = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("customers").update({ is_active: false }).eq("id", id);
    if (error) return { error: error.message };
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    return {};
  }, []);

  return {
    customers,
    loading,
    refresh: fetch,
    createCustomer,
    updateCustomer,
    deactivateCustomer,
  };
}
