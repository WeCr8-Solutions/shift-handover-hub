#!/usr/bin/env node
/**
 * @wecr8mcp/server — WeCr8 Manufacturing Context Protocol MCP Server
 *
 * Exposes the shift-handover-hub Supabase backend to AI agents
 * via the Anthropic Model Context Protocol (MCP).
 *
 * Tables (verified against src/integrations/supabase/types.ts):
 *   equipment       → machines / CNC / stations equipment
 *   stations        → work centers
 *   queue_items     → jobs / work order queue  (was: work_orders)
 *   handoff_records → shift handover data       (was: shift_handoff_records)
 *   activity_logs   → system audit log          (was: activity_log)
 *   profiles        → operators / users
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createSupabaseClient } from "./lib/supabase.js";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
// Load .env from mcp/ regardless of process cwd (works from dist/index.js or src/index.ts)
dotenvConfig({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const server = new McpServer({
  name: "wecr8mcp",
  version: "0.2.0",
});

const supabase = createSupabaseClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: wecr8mcp_observe  (MCI Primitive 1)
// Read current state of any physical entity
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "wecr8mcp_observe",
  "Read current state of a physical entity: machine (equipment table), station (work center), work_order (queue_items), or operator (profile). Returns data with confidence scoring based on freshness. Omit entity_id to list all.",
  {
    entity_type: z.enum(["machine", "station", "work_order", "operator"]).describe("Entity type to observe"),
    entity_id: z.string().optional().describe("Specific entity UUID. Omit to list all of this type."),
  },
  async ({ entity_type, entity_id }) => {
    try {
      let data: any;
      let source: string;

      switch (entity_type) {
        case "machine": {
          let q = supabase.from("equipment").select("*, stations(name, work_center_type)");
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("name").limit(100);
          const r = await q;
          if (r.error) throw r.error;
          data = entity_id ? r.data?.[0] : r.data;
          source = "equipment";
          break;
        }
        case "station": {
          let q = supabase.from("stations").select("*");
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("name").limit(100);
          const r = await q;
          if (r.error) throw r.error;
          data = entity_id ? r.data?.[0] : r.data;
          source = "stations";
          break;
        }
        case "work_order": {
          // Table: queue_items (Supabase schema)
          let q = supabase.from("queue_items").select(
            "id, part_number, description, status, priority, current_phase, station_id, due_date, " +
            "qty_completed, parts_completed, operation_number, assigned_to, created_at, updated_at"
          );
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("created_at", { ascending: false }).limit(50);
          const r = await q;
          if (r.error) throw r.error;
          data = entity_id ? r.data?.[0] : r.data;
          source = "queue_items";
          break;
        }
        case "operator": {
          // Table: profiles — display_name is the name field (not full_name)
          let q = supabase.from("profiles").select("id, display_name, email, avatar_url, created_at, updated_at");
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("display_name").limit(100);
          const r = await q;
          if (r.error) throw r.error;
          data = entity_id ? r.data?.[0] : r.data;
          source = "profiles";
          break;
        }
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { content: [{ type: "text" as const, text: `No ${entity_type} found${entity_id ? ` with id ${entity_id}` : ""}` }] };
      }

      const ts = Array.isArray(data) ? null : (data.updated_at || data.created_at);
      const ageMin = ts ? (Date.now() - new Date(ts).getTime()) / 60_000 : Infinity;
      const confidence = ageMin < 1 ? 1.0 : ageMin < 5 ? 0.95 : ageMin < 60 ? 0.85 : 0.6;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          entity_type,
          entity_id: entity_id ?? "all",
          count: Array.isArray(data) ? data.length : 1,
          confidence: Array.isArray(data) ? null : confidence,
          source,
          timestamp: new Date().toISOString(),
          data,
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error observing ${entity_type}: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_get_shift_notes  (HCL - Human Context Layer)
// Retrieve shift handoff records
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_shift_notes",
  "Retrieve shift handover / handoff records from the handoff_records table. Contains operator observations, machine readiness, quality status, tooling notes, and issues. Filter by station, shift, or date.",
  {
    station_id: z.string().optional().describe("Filter by station UUID"),
    shift: z.string().optional().describe("Filter by shift (e.g. Day, Swing, Night)"),
    limit: z.number().optional().default(20).describe("Max records (default 20)"),
  },
  async ({ station_id, shift, limit }) => {
    try {
      let q = supabase
        .from("handoff_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);

      if (station_id) q = q.eq("station_id", station_id);
      if (shift) q = q.eq("shift", shift);

      const { data, error } = await q;
      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          count: data?.length ?? 0,
          handoff_records: data ?? [],
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_search_knowledge
// Full-text search across handoff records + activity logs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_search_knowledge",
  "Search across shift handoff records and system activity logs. Use natural language to find operator knowledge, machine quirks, quality issues, or past incidents.",
  {
    query: z.string().describe("Search query (natural language)"),
    limit: z.number().optional().default(15).describe("Max results"),
  },
  async ({ query: q, limit }) => {
    try {
      // Search activity_logs via description
      const activityResult = await supabase
        .from("activity_logs")
        .select("id, activity_type, description, metadata, created_at")
        .ilike("description", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(limit ?? 15);

      // Search handoff_records via handoff_summary + process notes
      const handoffResult = await supabase
        .from("handoff_records")
        .select("id, station_id, shift, machine_id, part_number, operation_number, handoff_summary, quality_notes, created_at")
        .or(`handoff_summary.ilike.%${q}%,process_notes_for_next_shift.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(limit ?? 15);

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          query: q,
          activity_log_hits: activityResult.data?.length ?? 0,
          handoff_hits: handoffResult.data?.length ?? 0,
          activity_logs: activityResult.data ?? [],
          handoff_matches: handoffResult.data ?? [],
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_create_note
// Log an AI observation (requires SUPABASE_SERVICE_KEY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_create_note",
  "Log an AI observation, prediction, or recommendation as a comment on a work order (queue item). Requires SUPABASE_SERVICE_KEY in mcp/.env for write access.",
  {
    description: z.string().describe("Note content (natural language)"),
    entity_type: z.enum(["equipment", "station", "work_order"]).optional().describe("Related entity type"),
    entity_id: z.string().optional().describe("Related entity UUID"),
    action_type: z.enum(["ai_insight", "ai_prediction", "ai_anomaly", "ai_recommendation", "note"]).optional().default("ai_insight"),
  },
  async ({ description, entity_type, entity_id, action_type }) => {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
    if (!serviceKey) {
      return { content: [{ type: "text" as const, text: JSON.stringify({
        success: false,
        message: "hcl_create_note requires SUPABASE_SERVICE_KEY in mcp/.env. " +
          "Get the service_role key from Supabase → Project Settings → API. " +
          "Read operations (observe, search, get_machines, etc.) work with the anon key.",
        entity_type,
        entity_id,
        note_content: description,
      }, null, 2) }] };
    }

    // With service key: write to queue_item_comments when entity is a work_order
    if (entity_type === "work_order" && entity_id) {
      try {
        // Fetch the queue item to get organization_id
        const { data: item, error: fetchErr } = await supabase
          .from("queue_items")
          .select("id, organization_id")
          .eq("id", entity_id)
          .single();
        if (fetchErr) throw fetchErr;

        const { data, error } = await supabase
          .from("queue_item_comments")
          .insert({
            queue_item_id: entity_id,
            organization_id: item.organization_id,
            content: `[${(action_type ?? "ai_insight").toUpperCase()}] ${description}`,
            user_id: "00000000-0000-0000-0000-000000000000", // system/AI user
            user_name: "WeCr8 MCP (AI)",
          })
          .select("id")
          .single();
        if (error) throw error;
        return { content: [{ type: "text" as const, text: JSON.stringify({
          success: true,
          comment_id: data.id,
          entity_type,
          entity_id,
          message: "Note added to work order comments",
        }, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error creating note: ${err.message}` }] };
      }
    }

    // For machine/station entities — notes stored as informational response
    return { content: [{ type: "text" as const, text: JSON.stringify({
      success: true,
      note_content: description,
      entity_type: entity_type ?? null,
      entity_id: entity_id ?? null,
      action_type,
      message: "Note acknowledged. To persist machine/station notes, add a notes field or use a maintenance record.",
    }, null, 2) }] };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_get_machines
// List equipment with station context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_machines",
  "List all machines/equipment in the facility with their station assignment, type, manufacturer, model, and status.",
  {
    station_id: z.string().optional().describe("Filter by station UUID"),
    equipment_type: z.string().optional().describe("Filter by type (e.g. CNC Mill, CNC Lathe)"),
  },
  async ({ station_id, equipment_type }) => {
    try {
      let q = supabase
        .from("equipment")
        .select("*, stations(id, name, work_center_type)")
        .order("name");

      if (station_id) q = q.eq("station_id", station_id);
      if (equipment_type) q = q.ilike("equipment_type", `%${equipment_type}%`);

      const { data, error } = await q;
      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          count: data?.length ?? 0,
          machines: data ?? [],
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_get_work_orders
// List queue items (work orders)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_work_orders",
  "List work orders / queue items. Returns part number, description, status, station, priority, and scheduling data. Status values: pending, queued, in_progress, on_hold, completed, cancelled.",
  {
    station_id: z.string().optional().describe("Filter by station UUID"),
    status: z.enum(["pending", "queued", "in_progress", "on_hold", "completed", "cancelled"]).optional().describe("Filter by status"),
    limit: z.number().optional().default(30).describe("Max results"),
  },
  async ({ station_id, status, limit }) => {
    try {
      let q = supabase
        .from("queue_items")
        .select("id, part_number, description, status, priority, current_phase, station_id, due_date, qty_completed, operation_number, assigned_to, created_at")
        .order("created_at", { ascending: false })
        .limit(limit ?? 30);

      if (station_id) q = q.eq("station_id", station_id);
      if (status) q = q.eq("status", status);

      const { data, error } = await q;
      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          count: data?.length ?? 0,
          work_orders: data ?? [],
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: hcl_get_handovers
// Recent shift handovers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_handovers",
  "Get recent shift handovers with summary, quality notes, and issues. Use this to understand what happened on previous shifts.",
  {
    limit: z.number().optional().default(5).describe("Number of recent handovers"),
  },
  async ({ limit }) => {
    try {
      const { data, error } = await supabase
        .from("handoff_records")
        .select(
          "id, shift, machine_id, part_number, operation_number, " +
          "handoff_summary, quality_notes, machine_condition, issues_follow_ups, " +
          "outgoing_operator_name, incoming_operator_name, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(limit ?? 5);

      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          count: data?.length ?? 0,
          handovers: data ?? [],
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: wecr8mcp_enrich  (MCI Primitive 4)
// Attach AI insight to an entity
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "wecr8mcp_enrich",
  "Attach an AI-generated insight, prediction, or anomaly flag to a physical entity. For work_order entities, persists as a queue item comment. Other entity types return an informational response. Requires SUPABASE_SERVICE_KEY for persistence.",
  {
    entity_type: z.enum(["equipment", "station", "work_order"]).describe("Entity type"),
    entity_id: z.string().describe("Entity UUID"),
    enrichment_type: z.enum(["prediction", "recommendation", "anomaly", "insight", "quality_flag"]).describe("Type of enrichment"),
    content: z.string().describe("Natural language description"),
    confidence: z.number().min(0).max(1).optional().default(0.85).describe("Confidence 0.0-1.0"),
  },
  async ({ entity_type, entity_id, enrichment_type, content, confidence }) => {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
    const label = `[${enrichment_type.toUpperCase()} conf=${((confidence ?? 0.85) * 100).toFixed(0)}%] ${content}`;

    if (!serviceKey) {
      return { content: [{ type: "text" as const, text: JSON.stringify({
        success: false,
        message: "wecr8mcp_enrich requires SUPABASE_SERVICE_KEY in mcp/.env for write access. " +
          "Get the service_role key from Supabase → Project Settings → API.",
        entity_type, entity_id, enrichment_type, confidence,
        enrichment_content: content,
      }, null, 2) }] };
    }

    if (entity_type === "work_order") {
      try {
        const { data: item, error: fetchErr } = await supabase
          .from("queue_items")
          .select("id, organization_id")
          .eq("id", entity_id)
          .single();
        if (fetchErr) throw fetchErr;

        const { data, error } = await supabase
          .from("queue_item_comments")
          .insert({
            queue_item_id: entity_id,
            organization_id: item.organization_id,
            content: label,
            user_id: "00000000-0000-0000-0000-000000000000",
            user_name: "WeCr8 MCP (AI)",
          })
          .select("id")
          .single();
        if (error) throw error;

        return { content: [{ type: "text" as const, text: JSON.stringify({
          success: true,
          enrichment_id: data.id,
          entity_type, entity_id, enrichment_type, confidence,
        }, null, 2) }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error enriching entity: ${err.message}` }] };
      }
    }

    return { content: [{ type: "text" as const, text: JSON.stringify({
      success: true,
      enrichment_type,
      entity_type,
      entity_id,
      confidence,
      enrichment_content: content,
      message: "Enrichment acknowledged. Machine/station persistence requires a maintenance_records integration.",
    }, null, 2) }] };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY?.trim();
  console.error(
    `[wecr8mcp] v0.2.0 — 8 tools available — ` +
    `reads: anon key — writes: ${hasServiceKey ? "service key ✓" : "service key missing (add to mcp/.env)"}`
  );
}

main().catch((err) => {
  console.error("[wecr8mcp] Fatal:", err);
  process.exit(1);
});
