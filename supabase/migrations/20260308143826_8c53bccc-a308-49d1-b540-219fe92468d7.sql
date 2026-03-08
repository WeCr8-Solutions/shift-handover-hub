
-- =============================================
-- 1. Expand verified_machine_library with new spec columns
-- =============================================
ALTER TABLE public.verified_machine_library
  ADD COLUMN IF NOT EXISTS max_spindle_rpm numeric,
  ADD COLUMN IF NOT EXISTS spindle_taper text,
  ADD COLUMN IF NOT EXISTS spindle_power_hp numeric,
  ADD COLUMN IF NOT EXISTS tool_magazine_capacity integer,
  ADD COLUMN IF NOT EXISTS max_tool_diameter numeric,
  ADD COLUMN IF NOT EXISTS max_tool_length numeric,
  ADD COLUMN IF NOT EXISTS control_type text,
  ADD COLUMN IF NOT EXISTS control_model text,
  ADD COLUMN IF NOT EXISTS max_turning_diameter numeric,
  ADD COLUMN IF NOT EXISTS max_turning_length numeric,
  ADD COLUMN IF NOT EXISTS bar_capacity_mm numeric,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS datasheet_url text;

-- =============================================
-- 2. Expand station_manual_machine_profiles with instance + spec columns
-- =============================================
ALTER TABLE public.station_manual_machine_profiles
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS asset_tag text,
  ADD COLUMN IF NOT EXISTS station_category text NOT NULL DEFAULT 'cnc_machine',
  ADD COLUMN IF NOT EXISTS year_installed integer,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS max_spindle_rpm numeric,
  ADD COLUMN IF NOT EXISTS spindle_taper text,
  ADD COLUMN IF NOT EXISTS spindle_power_hp numeric,
  ADD COLUMN IF NOT EXISTS tool_magazine_capacity integer,
  ADD COLUMN IF NOT EXISTS max_tool_diameter numeric,
  ADD COLUMN IF NOT EXISTS max_tool_length numeric,
  ADD COLUMN IF NOT EXISTS control_type text,
  ADD COLUMN IF NOT EXISTS control_model text,
  ADD COLUMN IF NOT EXISTS max_turning_diameter numeric,
  ADD COLUMN IF NOT EXISTS max_turning_length numeric,
  ADD COLUMN IF NOT EXISTS bar_capacity_mm numeric,
  ADD COLUMN IF NOT EXISTS image_url text;

-- =============================================
-- 3. Add comment for station_category allowed values
-- =============================================
COMMENT ON COLUMN public.station_manual_machine_profiles.station_category IS 
  'Station type: cnc_machine, assembly, inspection, workstation, desk, welding, paint_finish, shipping_receiving, tool_crib, deburr, wash, other';
