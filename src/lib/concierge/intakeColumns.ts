/**
 * Single source of truth for Concierge intake worksheet columns.
 * MUST stay aligned with:
 *   - src/components/admin/onboarding/EngagementDetail.tsx (MODULE_HELP)
 *   - supabase/functions/onboarding-bulk-import/index.ts
 *   - public/templates/JobLine_Setup_Template.xlsx
 */
export const INTAKE_COLUMNS = {
  equipment: ["asset_tag","name","equipment_type","manufacturer","model","serial_number","controller","machine_type","location","notes"],
  stations: ["department","station_name","station_id","station_type","capacity","shift_pattern"],
  users_roles: ["email","first_name","last_name","role","department","default_station","phone","send_invite_now"],
  routing: ["template_name","step_number","operation","work_center","setup_minutes","run_minutes_per_unit","dimension_spec","quality_checkpoint"],
  quality: ["checkpoint_name","operation_after","tool_required","frequency","sample_size"],
  erp: ["system","base_url","auth_method","persistence_mode","notes"],
  training: ["email","program","required_by"],
} as const;

export type IntakeWorksheetKey = keyof typeof INTAKE_COLUMNS;

export const WORKSHEET_TITLES: Record<IntakeWorksheetKey, string> = {
  equipment: "Equipment & Machines",
  stations: "Departments & Stations",
  users_roles: "Users, Roles & Invites",
  routing: "Routing Templates",
  quality: "Quality Checkpoints",
  erp: "ERP Connector Questionnaire",
  training: "OAP Training Assignments",
};
