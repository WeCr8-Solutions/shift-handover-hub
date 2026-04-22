import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncRequest {
  organization_id: string;
  sync_type: "full" | "incremental";
  test_connection?: boolean;
  retry_error_ids?: string[];
}

interface ERPWorkOrder {
  erp_job_id: string;
  work_order_number?: string;
  part_number?: string;
  part_name?: string;
  customer_name?: string;
  quantity_ordered?: number;
  quantity_complete?: number;
  quantity_remaining?: number;
  due_date?: string;
  priority?: string;
  status?: string;
  release_date?: string;
  sales_order_ref?: string;
}

interface ERPOperation {
  erp_job_id: string;
  erp_operation_id: string;
  sequence_number: number;
  work_center_id?: string;
  work_center_name?: string;
  operation_status?: string;
  cycle_time_minutes?: number;
  setup_time_minutes?: number;
  remaining_qty?: number;
}

interface ERPWorkCenter {
  erp_work_center_id: string;
  name: string;
  department?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json();
    const { organization_id, sync_type = "incremental", test_connection = false, retry_error_ids } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is org admin
    const { data: membership } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organization_id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Org admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enterprise plan gate
    const { data: entitlement } = await adminClient
      .from("entitlements")
      .select("plan")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!entitlement || entitlement.plan !== "enterprise") {
      return new Response(
        JSON.stringify({ error: "ERP Connector requires an Enterprise plan. Please upgrade to access this feature." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load ERP connection
    const { data: connection, error: connError } = await adminClient
      .from("erp_connections")
      .select("*")
      .eq("organization_id", organization_id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "No ERP connection configured" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Retry failed records mode ----
    if (retry_error_ids && retry_error_ids.length > 0) {
      return await handleRetryErrors(adminClient, connection, organization_id, retry_error_ids, userId);
    }

    // ---- ITAR/FedRAMP persistence-mode gate ─────────────────────────────────
    // For read_through orgs (default for ITAR), JobBOSS data must NEVER be
    // copied into queue_items. Test connection is allowed; sync is rejected.
    // Mirrors sap-sync gate. get_erp_persistence_mode() falls back to
    // 'read_through' which is the safe default.
    const { data: persistenceModeData } = await adminClient.rpc(
      "get_erp_persistence_mode",
      { _org_id: organization_id },
    );
    const persistenceMode = (persistenceModeData as string) ?? "read_through";

    // Test connection mode
    if (test_connection) {
      try {
        await fetchOAuthToken(connection, adminClient);
        await adminClient
          .from("erp_connections")
          .update({ connection_status: "connected", last_tested_at: new Date().toISOString() })
          .eq("id", connection.id);

        return new Response(
          JSON.stringify({ success: true, status: "connected", message: "Connection test successful" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        await adminClient
          .from("erp_connections")
          .update({ connection_status: "error", last_tested_at: new Date().toISOString() })
          .eq("id", connection.id);

        return new Response(
          JSON.stringify({ success: false, status: "error", message: err.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ---- Sync cooldown check (5 min debounce) ----
    const { data: lastSyncCheck } = await adminClient
      .from("erp_sync_logs")
      .select("completed_at")
      .eq("organization_id", organization_id)
      .in("status", ["success", "partial", "running"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSyncCheck?.completed_at) {
      const lastSyncTime = new Date(lastSyncCheck.completed_at).getTime();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
      const elapsed = Date.now() - lastSyncTime;
      if (elapsed < cooldownMs) {
        const waitMinutes = Math.ceil((cooldownMs - elapsed) / 60000);
        return new Response(
          JSON.stringify({ error: `Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before syncing again.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ---- Persistence-mode short-circuit ─────────────────────────────────────
    // ITAR / FedRAMP: read_through orgs cannot copy ERP data into queue_items.
    // Surface a 200 success with skipped=true so the UI can render a banner
    // and the user understands the dashboard will read live from JobBOSS.
    if (persistenceMode === "read_through") {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "read_through_persistence_mode",
          message:
            "Organization is in read_through mode (default for ITAR/FedRAMP). " +
            "JobBOSS work orders are not copied into Lovable Cloud — the dashboard reads them live. " +
            "Set erp_persistence_mode='write_through' on a non-ITAR org to enable sync.",
          records_fetched: 0,
          records_created: 0,
          records_updated: 0,
          errors_count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Full sync flow (write_through only) ────────────────────────────────
    const startTime = Date.now();

    // Check ERP usage metering
    const { data: usageResult, error: usageError } = await adminClient
      .rpc("increment_erp_sync_usage", { _org_id: organization_id });

    if (usageError) {
      console.warn("[ERP-SYNC] Usage metering error (non-blocking):", usageError.message);
    } else if (usageResult?.limit_reached) {
      return new Response(
        JSON.stringify({
          error: "ERP sync limit reached for your current plan. Upgrade to continue syncing.",
          sync_count: usageResult.sync_count,
          sync_limit: usageResult.sync_limit,
          erp_tier: usageResult.erp_tier,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create sync log
    const { data: syncLog, error: logError } = await adminClient
      .from("erp_sync_logs")
      .insert({
        organization_id,
        erp_connection_id: connection.id,
        sync_type,
        triggered_by: "manual",
        status: "running",
      })
      .select()
      .single();

    if (logError || !syncLog) {
      return new Response(JSON.stringify({ error: "Failed to create sync log" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recordsFetched = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let errorsCount = 0;
    const errorDetails: any[] = [];

    try {
      // 1. Authenticate to ERP (with token caching)
      const accessToken = await fetchOAuthToken(connection, adminClient);

      // 2. Load mappings
      const { data: statusMappings } = await adminClient
        .from("erp_status_mappings")
        .select("*")
        .eq("organization_id", organization_id);

      const { data: workCenterMappings } = await adminClient
        .from("erp_work_center_mappings")
        .select("*")
        .eq("organization_id", organization_id);

      const statusMap = new Map((statusMappings || []).map((m) => [m.erp_status, m.jobline_status]));
      const wcMap = new Map((workCenterMappings || []).map((m) => [m.erp_work_center_id, m.jobline_station_id]));

      // 3. Fetch work orders
      const fieldMapping = (connection.metadata as any)?.field_mapping || {};
      const lastSyncLog = sync_type === "incremental"
        ? await getLastSuccessfulSync(adminClient, connection.id)
        : null;

      const workOrders = await fetchERPWorkOrders(connection, accessToken, fieldMapping, lastSyncLog?.completed_at);
      recordsFetched += workOrders.length;

      // 4. Upsert work orders
      for (const wo of workOrders) {
        try {
          const mappedStatus = statusMap.get(wo.status || "") || "pending";
          const existingItem = await adminClient
            .from("queue_items")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("erp_job_id", wo.erp_job_id)
            .maybeSingle();

          if (existingItem.data) {
            await adminClient
              .from("queue_items")
              .update({
                title: wo.part_name || wo.work_order_number || wo.erp_job_id,
                part_number: wo.part_number,
                quantity: wo.quantity_ordered,
                qty_original: wo.quantity_ordered,
                qty_completed: wo.quantity_complete,
                due_date: wo.due_date,
                status: mappedStatus,
                erp_source: connection.erp_vendor,
                erp_last_synced_at: new Date().toISOString(),
                work_order: wo.work_order_number || wo.erp_job_id,
              })
              .eq("id", existingItem.data.id);
            recordsUpdated++;
          } else {
            const { data: maxPos } = await adminClient
              .from("queue_items")
              .select("position")
              .eq("organization_id", organization_id)
              .order("position", { ascending: false })
              .limit(1)
              .maybeSingle();

            await adminClient.from("queue_items").insert({
              organization_id,
              item_type: "work_order",
              title: wo.part_name || wo.work_order_number || wo.erp_job_id,
              work_order: wo.work_order_number || wo.erp_job_id,
              part_number: wo.part_number,
              quantity: wo.quantity_ordered,
              qty_original: wo.quantity_ordered,
              qty_completed: wo.quantity_complete || 0,
              due_date: wo.due_date,
              priority: mapERPPriority(wo.priority),
              status: mappedStatus,
              position: (maxPos?.position || 0) + 1,
              erp_job_id: wo.erp_job_id,
              erp_source: connection.erp_vendor,
              erp_last_synced_at: new Date().toISOString(),
            });
            recordsCreated++;
          }
        } catch (err: any) {
          errorsCount++;
          errorDetails.push({ erp_job_id: wo.erp_job_id, error: err.message });
          await adminClient.from("erp_sync_errors").insert({
            organization_id,
            sync_log_id: syncLog.id,
            erp_record_type: "work_order",
            erp_record_id: wo.erp_job_id,
            error_message: err.message?.substring(0, 500) || "Unknown error",
          });
        }
      }

      // 5. Fetch and upsert operations/routing
      const operations = await fetchERPOperations(connection, accessToken, fieldMapping, lastSyncLog?.completed_at);
      recordsFetched += operations.length;

      for (const op of operations) {
        try {
          const { data: parentWO } = await adminClient
            .from("queue_items")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("erp_job_id", op.erp_job_id)
            .maybeSingle();

          if (!parentWO) continue;

          const stationId = wcMap.get(op.work_center_id || "") || null;

          const { data: existingRoute } = await adminClient
            .from("work_order_routing")
            .select("id")
            .eq("queue_item_id", parentWO.id)
            .eq("erp_operation_id", op.erp_operation_id)
            .maybeSingle();

          const routeData = {
            queue_item_id: parentWO.id,
            organization_id,
            step_number: op.sequence_number,
            operation_name: op.work_center_name || `Op ${op.sequence_number}`,
            operation_type: "machine",
            station_id: stationId,
            status: mapOperationStatus(op.operation_status),
            erp_operation_id: op.erp_operation_id,
            erp_sequence_number: op.sequence_number,
            setup_time_minutes: op.setup_time_minutes,
            cycle_time_minutes: op.cycle_time_minutes,
          };

          if (existingRoute) {
            await adminClient
              .from("work_order_routing")
              .update(routeData)
              .eq("id", existingRoute.id);
            recordsUpdated++;
          } else {
            await adminClient.from("work_order_routing").insert(routeData);
            recordsCreated++;
          }
        } catch (err: any) {
          errorsCount++;
          await adminClient.from("erp_sync_errors").insert({
            organization_id,
            sync_log_id: syncLog.id,
            erp_record_type: "operation",
            erp_record_id: op.erp_operation_id,
            error_message: err.message?.substring(0, 500) || "Unknown error",
          });
        }
      }

      // 6. Fetch and upsert work centers
      const workCenters = await fetchERPWorkCenters(connection, accessToken, fieldMapping);
      recordsFetched += workCenters.length;

      for (const wc of workCenters) {
        try {
          await adminClient
            .from("erp_work_center_mappings")
            .upsert(
              {
                organization_id,
                erp_work_center_id: wc.erp_work_center_id,
                erp_work_center_name: wc.name,
              },
              { onConflict: "organization_id,erp_work_center_id" }
            );
        } catch (err: any) {
          errorsCount++;
          await adminClient.from("erp_sync_errors").insert({
            organization_id,
            sync_log_id: syncLog.id,
            erp_record_type: "work_center",
            erp_record_id: wc.erp_work_center_id,
            error_message: err.message?.substring(0, 500) || "Unknown error",
          });
        }
      }

      // Update connection status
      await adminClient
        .from("erp_connections")
        .update({ connection_status: "connected", last_tested_at: new Date().toISOString() })
        .eq("id", connection.id);

      // Finalize sync log
      const duration = Date.now() - startTime;
      const finalStatus = errorsCount > 0 ? "partial" : "success";
      await adminClient
        .from("erp_sync_logs")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          records_fetched: recordsFetched,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          errors_count: errorsCount,
          error_details: errorDetails.length > 0 ? errorDetails : null,
          duration_ms: duration,
        })
        .eq("id", syncLog.id);

      return new Response(
        JSON.stringify({
          success: true,
          sync_log_id: syncLog.id,
          records_fetched: recordsFetched,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          errors_count: errorsCount,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      const duration = Date.now() - startTime;

      // Mark sync as failed
      await adminClient
        .from("erp_sync_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_details: [{ error: err.message }],
          duration_ms: duration,
        })
        .eq("id", syncLog.id);

      // ---- Connection health monitoring: check consecutive failures ----
      await checkAndAlertConsecutiveFailures(adminClient, organization_id, connection.id);

      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---- Health monitoring: alert on 3+ consecutive failures ----
async function checkAndAlertConsecutiveFailures(adminClient: any, orgId: string, connectionId: string) {
  try {
    const { data: recentLogs } = await adminClient
      .from("erp_sync_logs")
      .select("status")
      .eq("erp_connection_id", connectionId)
      .order("started_at", { ascending: false })
      .limit(3);

    if (!recentLogs || recentLogs.length < 3) return;
    const allFailed = recentLogs.every((l: any) => l.status === "failed");
    if (!allFailed) return;

    // Check if we already notified recently (last 24h)
    const { data: existingNotif } = await adminClient
      .from("notification_queue")
      .select("id")
      .eq("notification_type", "erp_health_alert")
      .eq("metadata->>organization_id", orgId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existingNotif) return; // Already notified

    // Insert notification for org admins
    const { data: admins } = await adminClient
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .in("role", ["owner", "admin"]);

    if (!admins || admins.length === 0) return;

    // Get admin emails
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, email")
      .in("user_id", admins.map((a: any) => a.user_id));

    for (const profile of (profiles || [])) {
      if (!profile.email) continue;
      await adminClient.from("notification_queue").insert({
        notification_type: "erp_health_alert",
        channel: "email",
        recipient: profile.email,
        subject: "ERP Connection Issue — 3 Consecutive Sync Failures",
        content: `Your ERP connection has failed 3 times in a row. Please check your connection settings and credentials.`,
        metadata: { organization_id: orgId, connection_id: connectionId },
        priority: "high",
      });
    }
  } catch (err) {
    console.warn("[ERP-SYNC] Health alert error (non-blocking):", err);
  }
}

// ---- Retry failed records handler ----
async function handleRetryErrors(
  adminClient: any,
  connection: any,
  orgId: string,
  errorIds: string[],
  userId: string
) {
  try {
    // Fetch the error records
    const { data: errors } = await adminClient
      .from("erp_sync_errors")
      .select("*")
      .in("id", errorIds)
      .eq("organization_id", orgId)
      .eq("resolved", false);

    if (!errors || errors.length === 0) {
      return new Response(
        JSON.stringify({ error: "No unresolved errors found for the given IDs" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as resolved (best-effort retry acknowledgment)
    const resolvedIds = errors.map((e: any) => e.id);
    await adminClient
      .from("erp_sync_errors")
      .update({ resolved: true, retry_count: errors[0].retry_count + 1 })
      .in("id", resolvedIds);

    return new Response(
      JSON.stringify({
        success: true,
        resolved_count: resolvedIds.length,
        message: `${resolvedIds.length} error(s) marked as resolved. They will be re-synced on next sync run.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// ---- OAuth token with caching ----
async function fetchOAuthToken(connection: any, adminClient?: any): Promise<string> {
  if (!connection.oauth_token_endpoint || !connection.client_id_encrypted || !connection.client_secret_encrypted) {
    throw new Error("OAuth configuration incomplete: missing token endpoint, client ID, or client secret");
  }

  // Check cached token in connection metadata
  const metadata = (connection.metadata as any) || {};
  if (metadata.cached_token && metadata.token_expires_at) {
    const expiresAt = new Date(metadata.token_expires_at).getTime();
    // Use cached token if it hasn't expired (with 60s buffer)
    if (expiresAt - 60000 > Date.now()) {
      return metadata.cached_token;
    }
  }

  const response = await fetch(connection.oauth_token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: connection.client_id_encrypted,
      client_secret: connection.client_secret_encrypted,
      scope: connection.scopes || "read-only",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth token request failed (${response.status}): ${text.substring(0, 200)}`);
  }

  const tokenData = await response.json();
  const accessToken = tokenData.access_token;

  // Cache the token with TTL (default 55 minutes if expires_in not provided)
  if (adminClient && accessToken) {
    const expiresInMs = (tokenData.expires_in || 3300) * 1000;
    const tokenExpiresAt = new Date(Date.now() + expiresInMs).toISOString();
    try {
      await adminClient
        .from("erp_connections")
        .update({
          metadata: {
            ...metadata,
            cached_token: accessToken,
            token_expires_at: tokenExpiresAt,
          },
        })
        .eq("id", connection.id);
    } catch {
      // Non-blocking: cache failure shouldn't break sync
    }
  }

  return accessToken;
}

async function fetchERPWorkOrders(
  connection: any,
  accessToken: string,
  fieldMapping: any,
  modifiedSince?: string | null
): Promise<ERPWorkOrder[]> {
  const baseUrl = connection.api_base_url?.replace(/\/$/, "");
  if (!baseUrl) return [];

  const endpoint = fieldMapping.work_orders_endpoint || "/api/work-orders";
  let url = `${baseUrl}${endpoint}`;

  const params = new URLSearchParams();
  if (modifiedSince) params.set("modified_since", modifiedSince);
  if (connection.tenant_identifier) params.set("tenant_id", connection.tenant_identifier);
  if (params.toString()) url += `?${params.toString()}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch work orders (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.items || data.results || [];

  const fm = fieldMapping.work_order_fields || {};
  return items.map((item: any) => ({
    erp_job_id: String(item[fm.job_id || "id"] || item.job_id || item.work_order_id || ""),
    work_order_number: item[fm.work_order_number || "work_order_number"] || item.wo_number,
    part_number: item[fm.part_number || "part_number"],
    part_name: item[fm.part_name || "part_name"] || item.description,
    customer_name: item[fm.customer_name || "customer_name"] || item.customer,
    quantity_ordered: Number(item[fm.quantity_ordered || "quantity_ordered"] || item.qty_ordered || 0),
    quantity_complete: Number(item[fm.quantity_complete || "quantity_complete"] || item.qty_complete || 0),
    quantity_remaining: Number(item[fm.quantity_remaining || "quantity_remaining"] || item.qty_remaining || 0),
    due_date: item[fm.due_date || "due_date"],
    priority: item[fm.priority || "priority"],
    status: item[fm.status || "status"],
    release_date: item[fm.release_date || "release_date"],
    sales_order_ref: item[fm.sales_order_ref || "sales_order_ref"] || item.so_number,
  }));
}

async function fetchERPOperations(
  connection: any,
  accessToken: string,
  fieldMapping: any,
  modifiedSince?: string | null
): Promise<ERPOperation[]> {
  const baseUrl = connection.api_base_url?.replace(/\/$/, "");
  if (!baseUrl) return [];

  const endpoint = fieldMapping.operations_endpoint || "/api/operations";
  let url = `${baseUrl}${endpoint}`;

  const params = new URLSearchParams();
  if (modifiedSince) params.set("modified_since", modifiedSince);
  if (connection.tenant_identifier) params.set("tenant_id", connection.tenant_identifier);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch operations (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.items || data.results || [];

  const fm = fieldMapping.operation_fields || {};
  return items.map((item: any) => ({
    erp_job_id: String(item[fm.job_id || "job_id"] || item.work_order_id || ""),
    erp_operation_id: String(item[fm.operation_id || "id"] || item.operation_id || ""),
    sequence_number: Number(item[fm.sequence_number || "sequence_number"] || item.op_number || 0),
    work_center_id: item[fm.work_center_id || "work_center_id"],
    work_center_name: item[fm.work_center_name || "work_center_name"],
    operation_status: item[fm.status || "status"],
    cycle_time_minutes: item[fm.cycle_time || "cycle_time_minutes"] ? Number(item[fm.cycle_time || "cycle_time_minutes"]) : undefined,
    setup_time_minutes: item[fm.setup_time || "setup_time_minutes"] ? Number(item[fm.setup_time || "setup_time_minutes"]) : undefined,
    remaining_qty: item[fm.remaining_qty || "remaining_qty"] ? Number(item[fm.remaining_qty || "remaining_qty"]) : undefined,
  }));
}

async function fetchERPWorkCenters(
  connection: any,
  accessToken: string,
  fieldMapping: any
): Promise<ERPWorkCenter[]> {
  const baseUrl = connection.api_base_url?.replace(/\/$/, "");
  if (!baseUrl) return [];

  const endpoint = fieldMapping.work_centers_endpoint || "/api/work-centers";
  let url = `${baseUrl}${endpoint}`;

  if (connection.tenant_identifier) {
    url += `?tenant_id=${encodeURIComponent(connection.tenant_identifier)}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch work centers (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.items || data.results || [];

  const fm = fieldMapping.work_center_fields || {};
  return items.map((item: any) => ({
    erp_work_center_id: String(item[fm.id || "id"] || item.work_center_id || ""),
    name: item[fm.name || "name"] || item.work_center_name || "",
    department: item[fm.department || "department"],
  }));
}

async function getLastSuccessfulSync(client: any, connectionId: string) {
  const { data } = await client
    .from("erp_sync_logs")
    .select("completed_at")
    .eq("erp_connection_id", connectionId)
    .in("status", ["success", "partial"])
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function mapERPPriority(priority?: string): string {
  if (!priority) return "normal";
  const p = priority.toLowerCase();
  if (p.includes("critical") || p.includes("emergency")) return "critical";
  if (p.includes("urgent") || p.includes("rush")) return "urgent";
  if (p.includes("high")) return "high";
  if (p.includes("low")) return "low";
  return "normal";
}

function mapOperationStatus(status?: string): string {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("finished")) return "completed";
  if (s.includes("progress") || s.includes("running") || s.includes("active")) return "in_progress";
  if (s.includes("hold") || s.includes("blocked")) return "on_hold";
  return "pending";
}
