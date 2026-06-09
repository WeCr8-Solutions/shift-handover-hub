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

export function useCustomers() {
  const { organization } = useOrgContext();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("customers")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name");
    if (!error) setCustomers((data as Customer[]) || []);
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createCustomer = useCallback(
    async (input: { name: string; contact_email?: string; contact_phone?: string; contact_name?: string }) => {
      if (!organization?.id || !user) return { error: "Not authenticated" };
      const { data, error } = await (supabase as any)
        .from("customers")
        .insert({
          organization_id: organization.id,
          name: input.name.trim(),
          contact_name: input.contact_name?.trim() || null,
          contact_email: input.contact_email?.trim() || null,
          contact_phone: input.contact_phone?.trim() || null,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) return { error: error.message };
      setCustomers((prev) => [...prev, data as Customer].sort((a, b) => a.name.localeCompare(b.name)));
      return { data: data as Customer };
    },
    [organization?.id, user],
  );

  return { customers, loading, refresh: fetch, createCustomer };
}
