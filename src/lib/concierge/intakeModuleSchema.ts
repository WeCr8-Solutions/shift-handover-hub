/**
 * Schema mapping for the Intake Tile Grid.
 *
 * Each intake module is defined by:
 *  - the live production table it reads/writes
 *  - the canonical column list (kept aligned with INTAKE_COLUMNS)
 *  - which fields drive the tile title + subtitle
 *  - per-field input hints for the auto-generated edit dialog
 *
 * Source-of-truth for column names: src/lib/concierge/intakeColumns.ts
 */
import type { IntakeWorksheetKey } from "./intakeColumns";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "select_from"
  | "boolean";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** For static `select` */
  options?: string[];
  /** For dynamic `select_from` — load from another live table scoped to the same org. */
  source?: { table: string; labelField: string; valueField?: string };
  help?: string;
}

/** Source key for an auth-derived default value (e.g. created_by = current user id). */
export type AuthDefaultKey = "user_id";

export interface IntakeModuleConfig {
  module: IntakeWorksheetKey | string;
  table: string;
  /** Column in the live table that stores the organization id. */
  orgColumn: string;
  /** Field used as the tile's primary title. */
  titleField: string;
  /** Up to 3 fields shown as the tile's subtitle/meta. */
  subtitleFields: string[];
  /** Editable fields exposed in the dialog. */
  fields: FieldDef[];
  /** Optional ORDER BY column. */
  orderBy?: string;
  /** Optional client-side default values applied to new rows. */
  defaults?: Record<string, unknown>;
  /** Auth-derived defaults injected at insert time (e.g. { created_by: 'user_id' }). */
  authDefaults?: Record<string, AuthDefaultKey>;
  /** Human label for the empty/add CTA. */
  noun: string;
}

export const INTAKE_MODULE_CONFIGS: Record<string, IntakeModuleConfig> = {
  equipment: {
    module: "equipment",
    table: "equipment",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["asset_tag", "manufacturer", "model"],
    noun: "Machine",
    fields: [
      { key: "name", label: "Display name", type: "text", required: true },
      { key: "asset_tag", label: "Asset tag", type: "text" },
      { key: "equipment_type", label: "Type", type: "select", options: ["cnc_mill","cnc_lathe","grinder","edm","saw","inspection","other"] },
      { key: "manufacturer", label: "Manufacturer", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "serial_number", label: "Serial number", type: "text" },
      { key: "location", label: "Location / floor zone", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["operational","maintenance","retired"] },
      { key: "description", label: "Notes", type: "textarea" },
    ],
    defaults: { status: "operational" },
  },

  teams: {
    module: "teams",
    table: "teams",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["description"],
    noun: "Team",
    fields: [
      { key: "name", label: "Team name", type: "text", required: true, help: "Must be unique within the organization." },
      { key: "description", label: "Description", type: "textarea" },
    ],
    authDefaults: { created_by: "user_id" },
  },

  departments: {
    module: "departments",
    table: "departments",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["description"],
    noun: "Department",
    fields: [
      { key: "team_id", label: "Team", type: "select_from", required: true,
        source: { table: "teams", labelField: "name" },
        help: "Departments must belong to a team. Create a team first if none exist." },
      { key: "name", label: "Department name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  stations: {
    module: "stations",
    table: "stations",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["station_id", "work_center"],
    noun: "Station",
    fields: [
      { key: "name", label: "Station name", type: "text", required: true },
      { key: "station_id", label: "Station code", type: "text", required: true, help: "Short unique code, e.g. MILL-01." },
      { key: "work_center", label: "Work center", type: "text", required: true, help: "Grouping label, e.g. MILL, LATHE." },
      { key: "work_center_type", label: "Work center type", type: "select", required: true,
        options: ["machining","milling","turning","grinding","edm","inspection","assembly","welding","finishing","outside_processing","office","other"] },
      { key: "department_id", label: "Department", type: "select_from",
        source: { table: "departments", labelField: "name" } },
      { key: "team_id", label: "Team", type: "select_from",
        source: { table: "teams", labelField: "name" } },
      { key: "daily_capacity_hours", label: "Daily capacity (hours)", type: "number", help: "1–24. Defaults to 8." },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaults: { work_center_type: "machining", daily_capacity_hours: 8, is_active: true },
  },

  quality: {
    module: "quality",
    table: "quality_checkpoints",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["frequency", "sample_size"],
    noun: "Checkpoint",
    fields: [
      { key: "name", label: "Checkpoint name", type: "text", required: true },
      { key: "frequency", label: "Frequency", type: "select", options: ["first_article","every_part","sampled","setup_only","final_only"] },
      { key: "sample_size", label: "Sample size", type: "number" },
      { key: "description", label: "Description / instructions", type: "textarea" },
    ],
    defaults: { frequency: "sampled", sample_size: 1 },
  },

  routing: {
    module: "routing",
    table: "routing_templates",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["description"],
    noun: "Routing template",
    fields: [
      { key: "name", label: "Template name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
};

/** Whether this module is rendered by the generic tile grid (others use bespoke editors). */
export function hasTileGridConfig(module: string): boolean {
  return module in INTAKE_MODULE_CONFIGS;
}
