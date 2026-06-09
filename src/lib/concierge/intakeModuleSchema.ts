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

export type FieldType = "text" | "textarea" | "number" | "email" | "select" | "boolean";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
}

export interface IntakeModuleConfig {
  module: IntakeWorksheetKey;
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
  /** Human label for the empty/add CTA. */
  noun: string;
}

export const INTAKE_MODULE_CONFIGS: Partial<Record<IntakeWorksheetKey, IntakeModuleConfig>> = {
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
  stations: {
    module: "stations",
    table: "stations",
    orgColumn: "organization_id",
    titleField: "name",
    subtitleFields: ["station_type", "capacity"],
    noun: "Station",
    fields: [
      { key: "name", label: "Station name", type: "text", required: true },
      { key: "station_type", label: "Type", type: "select", options: ["machining","inspection","assembly","finishing","outside_processing","other"] },
      { key: "capacity", label: "Capacity (concurrent jobs)", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
    ],
    defaults: { capacity: 1, station_type: "machining" },
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
export function hasTileGridConfig(module: IntakeWorksheetKey): boolean {
  return module in INTAKE_MODULE_CONFIGS;
}
