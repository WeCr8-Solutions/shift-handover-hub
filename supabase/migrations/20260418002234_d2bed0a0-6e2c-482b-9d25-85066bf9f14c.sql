
-- 1. Vertical enum
DO $$ BEGIN
  CREATE TYPE public.oap_vertical AS ENUM (
    'machining','cabinetry','automotive','welding','construction','electrical','plumbing','hvac','general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add vertical to existing OAP tables (default machining for backfill)
ALTER TABLE public.oap_certificates
  ADD COLUMN IF NOT EXISTS vertical public.oap_vertical NOT NULL DEFAULT 'machining';
ALTER TABLE public.oap_role_programs
  ADD COLUMN IF NOT EXISTS vertical public.oap_vertical NOT NULL DEFAULT 'machining';
ALTER TABLE public.oap_operator_credentials
  ADD COLUMN IF NOT EXISTS vertical public.oap_vertical NOT NULL DEFAULT 'machining';

CREATE INDEX IF NOT EXISTS idx_oap_certificates_vertical ON public.oap_certificates(vertical);
CREATE INDEX IF NOT EXISTS idx_oap_role_programs_vertical ON public.oap_role_programs(vertical);
CREATE INDEX IF NOT EXISTS idx_oap_operator_credentials_vertical ON public.oap_operator_credentials(vertical);

-- 3. Canonical role tiers per vertical
CREATE TABLE IF NOT EXISTS public.oap_vertical_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical public.oap_vertical NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  tier int NOT NULL DEFAULT 1, -- 1=apprentice/entry, 5=master
  description text,
  typical_duties text[],
  prerequisites text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical, slug)
);

ALTER TABLE public.oap_vertical_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vertical_roles read all authed"
  ON public.oap_vertical_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vertical_roles platform admin write"
  ON public.oap_vertical_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Canonical safety credentials per vertical
CREATE TABLE IF NOT EXISTS public.oap_safety_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical public.oap_vertical NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  issuing_body text,
  description text,
  validity_months int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical, slug)
);

ALTER TABLE public.oap_safety_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_creds read all authed"
  ON public.oap_safety_credentials FOR SELECT TO authenticated USING (true);
CREATE POLICY "safety_creds platform admin write"
  ON public.oap_safety_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Update timestamp triggers
DROP TRIGGER IF EXISTS trg_oap_vertical_roles_updated ON public.oap_vertical_roles;
CREATE TRIGGER trg_oap_vertical_roles_updated BEFORE UPDATE ON public.oap_vertical_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_oap_safety_credentials_updated ON public.oap_safety_credentials;
CREATE TRIGGER trg_oap_safety_credentials_updated BEFORE UPDATE ON public.oap_safety_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed roles (MVP ~10 per vertical, varying)
INSERT INTO public.oap_vertical_roles (vertical, slug, name, tier, description) VALUES
  -- Cabinetry / Woodworking
  ('cabinetry','apprentice-cabinetmaker','Apprentice Cabinetmaker',1,'Entry-level shop helper, learning hand tools, panel layout, and assembly.'),
  ('cabinetry','journeyman-cabinetmaker','Journeyman Cabinetmaker',3,'Builds full cabinets from drawings; runs table saw, edge bander, and case-clamp.'),
  ('cabinetry','master-cabinetmaker','Master Cabinetmaker',5,'Custom and architectural millwork; mentors apprentices.'),
  ('cabinetry','cnc-router-operator','CNC Router Operator',2,'Loads sheet goods, runs nest programs, manages tooling on flatbed routers.'),
  ('cabinetry','edgebander-operator','Edgebander Operator',2,'Runs automatic edgebanders, handles tape/pre-glued material, trim and buff.'),
  ('cabinetry','finisher','Wood Finisher',3,'Surface prep, stain, lacquer, and conversion-varnish spray finishing.'),
  ('cabinetry','installer','Cabinet Installer',2,'Field install, scribing, hardware adjustment, punch-list resolution.'),
  ('cabinetry','drafter-cad','Cabinet CAD Drafter',3,'Cabinet Vision / Mozaik / AutoCAD drafting and nest output.'),
  ('cabinetry','shop-foreman','Shop Foreman',4,'Schedules production, manages QC, oversees cabinetry crew.'),
  -- Automotive — General
  ('automotive','lube-tech','Lube Technician',1,'Oil changes, fluid top-offs, tire rotations, multi-point inspections.'),
  ('automotive','tire-tech','Tire Technician',1,'Mounting, balancing, TPMS service, alignment prep.'),
  ('automotive','general-service-tech','General Service Technician',2,'Brakes, suspension, basic electrical, scheduled maintenance.'),
  ('automotive','mechanic','Automotive Mechanic',3,'Diagnostics, drivability, engine and transmission service.'),
  ('automotive','master-mechanic','Master Mechanic',5,'ASE Master certified; full diagnostic and repair authority.'),
  ('automotive','service-advisor','Service Advisor',3,'Customer-facing estimates, work-order writing, upsell.'),
  ('automotive','shop-foreman-auto','Shop Foreman',4,'Dispatches work, mentors techs, signs off on QC.'),
  -- Automotive — Specialty
  ('automotive','diesel-tech','Diesel / Heavy-Duty Technician',3,'Heavy trucks, fleet, regen and aftertreatment service.'),
  ('automotive','ev-hybrid-tech','EV / Hybrid Technician',4,'High-voltage safety, battery service, EV diagnostics.'),
  ('automotive','transmission-tech','Transmission Specialist',4,'Automatic and manual rebuilds, valve body work.'),
  ('automotive','collision-tech','Collision / Body Technician',3,'Frame, panel replacement, structural welding.'),
  ('automotive','paint-tech','Refinish / Paint Technician',3,'Color match, blend, clear-coat application and polish.'),
  ('automotive','alignment-tech','Alignment Specialist',3,'Hunter / John Bean alignment racks, geometry corrections.'),
  -- Welding
  ('welding','tack-welder','Tack Welder',1,'Fit-up tacking under a journeyman; basic cuts and grinding.'),
  ('welding','journeyman-welder','Journeyman Welder',3,'MIG/TIG/Stick to drawing, weld symbols, distortion control.'),
  ('welding','certified-welder-aws','AWS Certified Welder',4,'AWS D1.1 / D1.5 / equivalent procedure-qualified production welder.'),
  ('welding','pipe-welder','Pipe Welder',4,'6G qualified; process piping, code work.'),
  ('welding','welding-foreman','Welding Foreman',5,'Crew lead, WPS interpretation, quality oversight.'),
  ('welding','welding-inspector-cwi','Welding Inspector (CWI)',5,'AWS CWI; weld inspection and documentation.'),
  -- Construction / Carpentry
  ('construction','laborer','General Laborer',1,'Site cleanup, material handling, basic tool use.'),
  ('construction','apprentice-carpenter','Apprentice Carpenter',1,'Framing, blocking, learning layout under a journeyman.'),
  ('construction','journeyman-carpenter','Journeyman Carpenter',3,'Framing, finish, formwork, blueprint reading.'),
  ('construction','master-carpenter','Master Carpenter',5,'Custom finish, stair build, project lead.'),
  ('construction','foreman','Site Foreman',4,'Crew scheduling, safety, quality control.'),
  ('construction','superintendent','Superintendent',5,'Multi-trade coordination, schedule, owner interface.'),
  -- Electrical
  ('electrical','apprentice-electrician','Apprentice Electrician',1,'Pulling wire, supporting journeyman, learning code.'),
  ('electrical','journeyman-electrician','Journeyman Electrician',3,'Licensed; full residential/commercial install and service.'),
  ('electrical','master-electrician','Master Electrician',5,'Permitting authority; pulls permits, mentors.'),
  ('electrical','industrial-electrician','Industrial Electrician',4,'PLC, motor control, three-phase, plant maintenance.'),
  ('electrical','low-voltage-tech','Low-Voltage Technician',2,'Data, security, AV, fire alarm.'),
  -- Plumbing
  ('plumbing','apprentice-plumber','Apprentice Plumber',1,'Material runs, basic install under a journeyman.'),
  ('plumbing','journeyman-plumber','Journeyman Plumber',3,'Licensed; rough-in, finish, service work.'),
  ('plumbing','master-plumber','Master Plumber',5,'Permitting authority; design and oversight.'),
  ('plumbing','pipefitter','Pipefitter',4,'Process and mechanical piping, large bore.'),
  ('plumbing','gas-fitter','Gas Fitter',3,'Natural gas, propane, code-compliant install and test.'),
  -- HVAC
  ('hvac','hvac-installer','HVAC Installer',2,'New install, ductwork, equipment set, line sets.'),
  ('hvac','hvac-service-tech','HVAC Service Technician',3,'Diagnostics, refrigerant work, controls.'),
  ('hvac','master-hvac-tech','Master HVAC Technician',5,'Commercial and complex residential; mentors crew.'),
  ('hvac','controls-tech','Building Controls Technician',4,'BMS, DDC, BACnet integration.'),
  ('hvac','refrigeration-tech','Commercial Refrigeration Tech',4,'Walk-ins, racks, supermarket refrigeration.')
ON CONFLICT (vertical, slug) DO NOTHING;

-- 7. Seed core safety credentials
INSERT INTO public.oap_safety_credentials (vertical, slug, name, issuing_body, description, validity_months) VALUES
  ('general','osha-10','OSHA 10-Hour General Industry','OSHA','Entry-level safety awareness training.',NULL),
  ('general','osha-30','OSHA 30-Hour General Industry','OSHA','Supervisor-level safety training.',NULL),
  ('construction','osha-10-construction','OSHA 10-Hour Construction','OSHA','Entry-level construction safety.',NULL),
  ('construction','osha-30-construction','OSHA 30-Hour Construction','OSHA','Supervisor construction safety.',NULL),
  ('general','first-aid-cpr','First Aid / CPR / AED','American Red Cross',NULL,24),
  ('general','forklift-cert','Powered Industrial Truck (Forklift)','Employer/OSHA','OSHA 1910.178 forklift operator.',36),
  ('automotive','ase-entry','ASE Entry-Level Certification','ASE',NULL,NULL),
  ('automotive','ase-master','ASE Master Automobile Technician','ASE','Passes A1–A8 series.',60),
  ('automotive','epa-609','EPA Section 609 (MVAC Refrigerant)','EPA','Required for MVAC refrigerant work.',NULL),
  ('hvac','epa-608','EPA Section 608 (Stationary Refrigerant)','EPA','Universal recommended.',NULL),
  ('hvac','nate-cert','NATE Certification','NATE',NULL,24),
  ('welding','aws-d1-1','AWS D1.1 Structural Steel Welder','AWS',NULL,6),
  ('welding','aws-cwi','AWS Certified Welding Inspector (CWI)','AWS',NULL,36),
  ('electrical','nfpa-70e','NFPA 70E Arc Flash Safety','NFPA',NULL,36),
  ('electrical','journeyman-license','State Journeyman Electrician License','State',NULL,NULL),
  ('plumbing','journeyman-plumber-license','State Journeyman Plumber License','State',NULL,NULL),
  ('plumbing','medical-gas-cert','ASSE 6010 Medical Gas Installer','ASSE',NULL,36),
  ('cabinetry','awi-qcp','AWI Quality Certification Program','AWI','Architectural Woodwork Institute.',NULL),
  ('cabinetry','spray-finishing-safety','Spray Finishing Safety','Employer/OSHA',NULL,24)
ON CONFLICT (vertical, slug) DO NOTHING;
