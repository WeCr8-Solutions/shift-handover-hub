-- Add new work center types to the work_center_type enum if it exists, or update stations table constraint
-- Note: We're not using an enum, just storing strings, so no migration needed for schema
-- This is just documentation of the new valid values

-- No schema changes needed - work_center_type is stored as text in stations table
-- The validation happens at the application layer in src/types/handoff.ts

SELECT 1; -- No-op migration to document the change