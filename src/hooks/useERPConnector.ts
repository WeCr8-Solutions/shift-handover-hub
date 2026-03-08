import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useToast } from "@/hooks/use-toast";

export interface ERPConnection {
  id: string;
  organization_id: string;
  erp_vendor: string;
  instance_type: string;
  api_base_url: string | null;
  oauth_token_endpoint: string | null;
  client_id_encrypted: string | null;
  client_secret_encrypted: string | null;
  scopes: string | null;
  tenant_identifier: string | null;
  sync_interval_minutes: number;
  is_active: boolean;
  last_tested_at: string | null;
  connection_status: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERPSyncLog {
  id: string;
  organization_id: string;
  erp_connection_id: string;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  records_fetched: number | null;
  records_created: number | null;
  records_updated: number | null;
  errors_count: number | null;
  error_details: unknown | null;
  duration_ms: number | null;
  triggered_by: string;
}

export interface ERPSyncError {
  id: string;
  erp_record_type: string;
  erp_record_id: string | null;
  error_message: string;
  retry_count: number;
  resolved: boolean;
  created_at: string;
}

export interface ERPWorkCenterMapping {
  id: string;
  organization_id: string;
  erp_work_center_id: string;
  erp_work_center_name: string | null;
  jobline_station_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERPStatusMapping {
  id: string;
  organization_id: string;
  erp_status: string;
  jobline_status: string;
  created_at: string;
}

export function useERPConnector() {
  const { organization } = useUserOrganization();
  const { toast } = useToast();
  const orgId = organization?.id;

  const [connection, setConnection] = useState<ERPConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<ERPSyncLog[]>([]);
  const [syncErrors, setSyncErrors] = useState<ERPSyncError[]>([]);
  const [workCenterMappings, setWorkCenterMappings] = useState<ERPWorkCenterMapping[]>([]);
  const [statusMappings, setStatusMappings] = useState<ERPStatusMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchConnection = useCallback(async () => {
    if (!orgId) return;
    // Use the safe view that excludes secrets
    const { data } = await supabase
      .from("erp_connections")
      .select("id, organization_id, erp_vendor, instance_type, api_base_url, oauth_token_endpoint, scopes, tenant_identifier, sync_interval_minutes, is_active, last_tested_at, connection_status, metadata, created_by, created_at, updated_at")
      .eq("organization_id", orgId)
      .maybeSingle();
    setConnection(data as unknown as ERPConnection | null);
  }, [orgId]);

  const fetchSyncLogs = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("erp_sync_logs")
      .select("*")
      .eq("organization_id", orgId)
      .order("started_at", { ascending: false })
      .limit(20);
    setSyncLogs((data || []) as ERPSyncLog[]);
  }, [orgId]);

  const fetchWorkCenterMappings = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("erp_work_center_mappings")
      .select("*")
      .eq("organization_id", orgId)
      .order("erp_work_center_name");
    setWorkCenterMappings((data || []) as ERPWorkCenterMapping[]);
  }, [orgId]);

  const fetchStatusMappings = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("erp_status_mappings")
      .select("*")
      .eq("organization_id", orgId)
      .order("erp_status");
    setStatusMappings((data || []) as ERPStatusMapping[]);
  }, [orgId]);

  const fetchSyncErrors = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("erp_sync_errors")
      .select("*")
      .eq("organization_id", orgId)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(50);
    setSyncErrors((data || []) as ERPSyncError[]);
  }, [orgId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConnection(), fetchSyncLogs(), fetchSyncErrors(), fetchWorkCenterMappings(), fetchStatusMappings()]);
    setLoading(false);
  }, [fetchConnection, fetchSyncLogs, fetchSyncErrors, fetchWorkCenterMappings, fetchStatusMappings]);

  useEffect(() => {
    if (orgId) loadAll();
  }, [orgId, loadAll]);

  const saveConnection = async (data: Partial<ERPConnection>) => {
    if (!orgId) return { error: "No organization" };

    if (connection) {
      const { error } = await supabase
        .from("erp_connections")
        .update(data as any)
        .eq("id", connection.id);
      if (error) return { error: error.message };
    } else {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("erp_connections").insert({
        organization_id: orgId,
        erp_vendor: data.erp_vendor || "other",
        api_base_url: data.api_base_url,
        oauth_token_endpoint: data.oauth_token_endpoint,
        client_id_encrypted: data.client_id_encrypted,
        client_secret_encrypted: data.client_secret_encrypted,
        scopes: data.scopes,
        created_by: authData?.user?.id || null,
        tenant_identifier: data.tenant_identifier,
        sync_interval_minutes: data.sync_interval_minutes || 10,
        is_active: data.is_active || false,
        metadata: data.metadata || {},
      } as any);
      if (error) return { error: error.message };
    }

    await fetchConnection();
    return { error: null };
  };

  const testConnection = async () => {
    if (!orgId) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("erp-sync", {
        body: { organization_id: orgId, sync_type: "full", test_connection: true },
      });
      if (error) throw error;
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      await fetchConnection();
    } catch (err: any) {
      toast({ title: "Connection Test Failed", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const runSync = async (syncType: "full" | "incremental" = "incremental") => {
    if (!orgId) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("erp-sync", {
        body: { organization_id: orgId, sync_type: syncType },
      });
      if (error) throw error;
      toast({
        title: "Sync Complete",
        description: `Fetched ${data.records_fetched}, Created ${data.records_created}, Updated ${data.records_updated}${data.errors_count > 0 ? `, ${data.errors_count} errors` : ""}`,
      });
      await Promise.all([fetchSyncLogs(), fetchWorkCenterMappings(), fetchSyncErrors()]);
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const retryFailedRecords = async (errorIds: string[]) => {
    if (!orgId || errorIds.length === 0) return;
    try {
      const { data, error } = await supabase.functions.invoke("erp-sync", {
        body: { organization_id: orgId, sync_type: "incremental", retry_error_ids: errorIds },
      });
      if (error) throw error;
      toast({
        title: "Errors Resolved",
        description: data.message || `${data.resolved_count} error(s) marked for re-sync.`,
      });
      await fetchSyncErrors();
    } catch (err: any) {
      toast({ title: "Retry Failed", description: err.message, variant: "destructive" });
    }
  };

  const updateWorkCenterMapping = async (id: string, joblineStationId: string | null) => {
    const { error } = await supabase
      .from("erp_work_center_mappings")
      .update({ jobline_station_id: joblineStationId } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await fetchWorkCenterMappings();
    }
  };

  const saveStatusMapping = async (erpStatus: string, joblineStatus: string) => {
    if (!orgId) return;
    const { error } = await supabase
      .from("erp_status_mappings")
      .upsert(
        { organization_id: orgId, erp_status: erpStatus, jobline_status: joblineStatus } as any,
        { onConflict: "organization_id,erp_status" }
      );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await fetchStatusMappings();
    }
  };

  const deleteStatusMapping = async (id: string) => {
    const { error } = await supabase.from("erp_status_mappings").delete().eq("id", id);
    if (!error) await fetchStatusMappings();
  };

  return {
    connection,
    syncLogs,
    syncErrors,
    workCenterMappings,
    statusMappings,
    loading,
    syncing,
    testing,
    saveConnection,
    testConnection,
    runSync,
    retryFailedRecords,
    updateWorkCenterMapping,
    saveStatusMapping,
    deleteStatusMapping,
    refresh: loadAll,
  };
}
