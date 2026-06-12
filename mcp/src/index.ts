#!/usr/bin/env node
/**
 * @wecr8mcp/server — WeCr8 Manufacturing Context Protocol MCP Server
 *
 * Exposes the shift-handover-hub Supabase backend to AI agents
 * via the Anthropic Model Context Protocol (MCP).
 *
 * Tables queried (same Supabase instance as frontend):
 *   equipment              → machines / CNC / stations equipment
 *   stations               → work centers
 *   work_orders            → jobs / queue
 *   shift_handoff_records  → shift handover data
 *   activity_log           → searchable operator knowledge
 *   profiles               → operators
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
  version: "0.1.0",
});

const supabase = createSupabaseClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL: wecr8mcp_observe  (MCI Primitive 1)
// Read current state of any physical entity
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "wecr8mcp_observe",
  "Read current state of a physical entity: machine (equipment table), station (work center), work_order (job), or operator (profile). Returns data with confidence scoring based on freshness. Omit entity_id to list all.",
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
          let q = supabase.from("work_orders").select("*");
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("created_at", { ascending: false }).limit(50);
          const r = await q;
          if (r.error) throw r.error;
          data = entity_id ? r.data?.[0] : r.data;
          source = "work_orders";
          break;
        }
        case "operator": {
          let q = supabase.from("profiles").select("id, full_name, role, avatar_url, created_at, updated_at");
          if (entity_id) q = q.eq("id", entity_id);
          else q = q.order("full_name").limit(100);
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
  "Retrieve shift handover / handoff records. Contains operator observations, machine readiness, quality status, tooling notes, and issues. Filter by station, shift, or date.",
  {
    station_id: z.string().optional().describe("Filter by station UUID"),
    shift: z.enum(["Day", "Swing", "Night"]).optional().describe("Filter by shift"),
    limit: z.number().optional().default(20).describe("Max records (default 20)"),
  },
  async ({ station_id, shift, limit }) => {
    try {
      let q = supabase
        .from("shift_handoff_records")
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
// Full-text search across activity log + handoffs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_search_knowledge",
  "Search across shift handoff records and activity logs. Use natural language to find operator knowledge, machine quirks, quality issues, or past incidents.",
  {
    query: z.string().describe("Search query (natural language)"),
    limit: z.number().optional().default(15).describe("Max results"),
  },
  async ({ query: q, limit }) => {
    try {
      // Search activity_log via ilike
      const activityResult = await supabase
        .from("activity_log")
        .select("*")
        .or(`description.ilike.%${q}%,details.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(limit ?? 15);

      // Also search handoff_records handoff_summary
      const handoffResult = await supabase
        .from("shift_handoff_records")
        .select("id, station_id, shift, work_order, work_center, handoff_summary, created_at")
        .ilike("handoff_summary", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(limit ?? 15);

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          query: q,
          activity_log_hits: activityResult.data?.length ?? 0,
          handoff_hits: handoffResult.data?.length ?? 0,
          activity_log: activityResult.data ?? [],
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
// AI agents create activity log entries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_create_note",
  "Log an AI observation, prediction, or recommendation to the activity log. This becomes searchable operator knowledge.",
  {
    description: z.string().describe("Note content (natural language)"),
    entity_type: z.enum(["equipment", "station", "work_order"]).optional().describe("Related entity type"),
    entity_id: z.string().optional().describe("Related entity UUID"),
    action_type: z.enum(["ai_insight", "ai_prediction", "ai_anomaly", "ai_recommendation", "note"]).optional().default("ai_insight"),
  },
  async ({ description, entity_type, entity_id, action_type }) => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .insert({
          action_type: action_type ?? "ai_insight",
          description,
          entity_type: entity_type ?? null,
          entity_id: entity_id ?? null,
          details: JSON.stringify({ source: "wecr8mcp", version: "0.1.0" }),
        })
        .select("id")
        .single();

      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          success: true,
          note_id: data.id,
          message: "Note logged to activity_log",
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error creating note: ${err.message}` }] };
    }
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
// List work orders / jobs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_work_orders",
  "List work orders (jobs). Returns order number, part info, status, station, priority, and scheduling data.",
  {
    station_id: z.string().optional().describe("Filter by station UUID"),
    status: z.string().optional().describe("Filter by status (e.g. active, pending, complete)"),
    limit: z.number().optional().default(30).describe("Max results"),
  },
  async ({ station_id, status, limit }) => {
    try {
      let q = supabase
        .from("work_orders")
        .select("*")
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
// Recent shift handovers with summaries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.tool(
  "hcl_get_handovers",
  "Get recent shift handovers with summary, quality status, and issues. Use this to understand what happened on previous shifts.",
  {
    limit: z.number().optional().default(5).describe("Number of recent handovers"),
  },
  async ({ limit }) => {
    try {
      const { data, error } = await supabase
        .from("shift_handoff_records")
        .select("id, shift, work_order, work_center, work_center_type, handoff_summary, quality_status, machine_condition, issues_follow_ups, created_at")
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
  "Attach an AI-generated insight, prediction, or anomaly flag to a physical entity. Stored in activity_log and becomes searchable knowledge.",
  {
    entity_type: z.enum(["equipment", "station", "work_order"]).describe("Entity type"),
    entity_id: z.string().describe("Entity UUID"),
    enrichment_type: z.enum(["prediction", "recommendation", "anomaly", "insight", "quality_flag"]).describe("Type of enrichment"),
    content: z.string().describe("Natural language description"),
    confidence: z.number().min(0).max(1).optional().default(0.85).describe("Confidence 0.0-1.0"),
  },
  async ({ entity_type, entity_id, enrichment_type, content, confidence }) => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .insert({
          action_type: `ai_${enrichment_type}`,
          description: `[${enrichment_type.toUpperCase()}] ${content}`,
          entity_type,
          entity_id,
          details: JSON.stringify({
            source: "wecr8mcp",
            enrichment_type,
            confidence,
            version: "0.1.0",
          }),
        })
        .select("id")
        .single();

      if (error) throw error;

      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          success: true,
          enrichment_id: data.id,
          entity_type,
          entity_id,
          enrichment_type,
          confidence,
        }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Error: ${err.message}` }] };
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[wecr8mcp] Server running on stdio — 8 tools available");
}

main().catch((err) => {
  console.error("[wecr8mcp] Fatal:", err);
  process.exit(1);
});