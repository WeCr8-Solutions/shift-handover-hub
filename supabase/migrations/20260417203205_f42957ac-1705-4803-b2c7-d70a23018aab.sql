-- Catalog tables
CREATE TABLE public.machining_operation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, organization_id)
);

CREATE TABLE public.machining_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.machining_operation_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  profession_tags text[] NOT NULL DEFAULT '{}',
  role_tags text[] NOT NULL DEFAULT '{}',
  machine_tags text[] NOT NULL DEFAULT '{}',
  typical_tooling text[] NOT NULL DEFAULT '{}',
  common_pitfalls text,
  safety_notes text,
  reference_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, organization_id)
);

CREATE TABLE public.org_machining_operation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL REFERENCES public.machining_operations(id) ON DELETE CASCADE,
  is_hidden boolean NOT NULL DEFAULT false,
  required_for_roles text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, operation_id)
);

CREATE INDEX idx_machining_operations_category ON public.machining_operations(category_id);
CREATE INDEX idx_machining_operations_org ON public.machining_operations(organization_id);
CREATE INDEX idx_machining_operations_profession ON public.machining_operations USING GIN(profession_tags);
CREATE INDEX idx_machining_operations_role ON public.machining_operations USING GIN(role_tags);
CREATE INDEX idx_machining_operations_machine ON public.machining_operations USING GIN(machine_tags);

CREATE TRIGGER trg_moc_updated BEFORE UPDATE ON public.machining_operation_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mo_updated BEFORE UPDATE ON public.machining_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_omoo_updated BEFORE UPDATE ON public.org_machining_operation_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.machining_operation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machining_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_machining_operation_overrides ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY "moc_read" ON public.machining_operation_categories FOR SELECT TO authenticated
  USING (is_canonical OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id)));
CREATE POLICY "moc_insert_canonical" ON public.machining_operation_categories FOR INSERT TO authenticated
  WITH CHECK (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "moc_insert_org" ON public.machining_operation_categories FOR INSERT TO authenticated
  WITH CHECK (NOT is_canonical AND organization_id IS NOT NULL
    AND (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id)));
CREATE POLICY "moc_update_canonical" ON public.machining_operation_categories FOR UPDATE TO authenticated
  USING (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "moc_update_org" ON public.machining_operation_categories FOR UPDATE TO authenticated
  USING (NOT is_canonical AND organization_id IS NOT NULL
    AND (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id)));
CREATE POLICY "moc_delete_canonical" ON public.machining_operation_categories FOR DELETE TO authenticated
  USING (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "moc_delete_org" ON public.machining_operation_categories FOR DELETE TO authenticated
  USING (NOT is_canonical AND organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

-- Operations
CREATE POLICY "mo_read" ON public.machining_operations FOR SELECT TO authenticated
  USING (is_canonical OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id)));
CREATE POLICY "mo_insert_canonical" ON public.machining_operations FOR INSERT TO authenticated
  WITH CHECK (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "mo_insert_org" ON public.machining_operations FOR INSERT TO authenticated
  WITH CHECK (NOT is_canonical AND organization_id IS NOT NULL
    AND (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id)));
CREATE POLICY "mo_update_canonical" ON public.machining_operations FOR UPDATE TO authenticated
  USING (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "mo_update_org" ON public.machining_operations FOR UPDATE TO authenticated
  USING (NOT is_canonical AND organization_id IS NOT NULL
    AND (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id)));
CREATE POLICY "mo_delete_canonical" ON public.machining_operations FOR DELETE TO authenticated
  USING (is_canonical AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "mo_delete_org" ON public.machining_operations FOR DELETE TO authenticated
  USING (NOT is_canonical AND organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

-- Overrides
CREATE POLICY "omoo_read" ON public.org_machining_operation_overrides FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "omoo_write" ON public.org_machining_operation_overrides FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));

-- Extend training_media polymorphic enum
ALTER TYPE public.training_media_entity ADD VALUE IF NOT EXISTS 'machining_operation';
ALTER TYPE public.training_media_entity ADD VALUE IF NOT EXISTS 'machining_operation_category';

-- Seed categories
INSERT INTO public.machining_operation_categories (slug,name,description,sort_order,is_canonical) VALUES
  ('milling','Milling','Rotating cutter removes material — contouring, pocketing, drilling cycles, helical interpolation.',10,true),
  ('turning','Turning','Workpiece rotates against single-point tool — OD, ID, facing, grooving, threading.',20,true),
  ('drilling-hole-making','Drilling & Hole-Making','Hole-making: drilling, peck, reaming, tapping, boring, counterbore.',30,true),
  ('grinding','Grinding','Abrasive material removal for finish and tight tolerance.',40,true),
  ('edm','EDM','Electrical Discharge Machining — sinker (ram), wire, small-hole.',50,true),
  ('gear-thread','Gear & Thread Generation','Hobbing, shaping, broaching, thread generation.',60,true),
  ('finishing-deburr','Finishing & Deburring','Polishing, lapping, honing, deburr, blasting, tumbling.',70,true),
  ('specialty','Specialty','Waterjet, laser, additive, swiss live tooling, broaching.',80,true);

-- Seed operations
WITH c AS (SELECT id, slug FROM public.machining_operation_categories WHERE is_canonical)
INSERT INTO public.machining_operations
  (category_id, slug, name, short_description, difficulty, profession_tags, role_tags, machine_tags, typical_tooling, sort_order, is_canonical)
SELECT c.id, v.slug, v.name, v.short_description, v.difficulty, v.profession_tags, v.role_tags, v.machine_tags, v.typical_tooling, v.sort_order, true
FROM c JOIN (VALUES
  ('milling','face-milling','Face Milling','Flat surface generation across large area with face mill.','beginner',ARRAY['machinist','programmer'],ARRAY['operator','supervisor'],ARRAY['vmc','hmc'],ARRAY['face mill','indexable insert'],10),
  ('milling','contouring','Contouring (2D/3D Profile)','Profile path produces side walls and 3D surfaces.','intermediate',ARRAY['machinist','programmer'],ARRAY['operator','supervisor'],ARRAY['vmc','hmc','5-axis'],ARRAY['end mill','ball mill','bull nose'],20),
  ('milling','pocketing','Pocketing','Material removal inside closed boundary (adaptive, trochoidal).','intermediate',ARRAY['machinist','programmer'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['end mill','high-feed mill'],30),
  ('milling','slotting','Slotting','Cutting full-width slot with end mill.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc'],ARRAY['end mill','slot drill','keyseat cutter'],40),
  ('milling','helical-interpolation','Helical Interpolation','Circular path descending in Z to bore or thread mill.','advanced',ARRAY['machinist','programmer'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['end mill','thread mill'],50),
  ('milling','ramping','Ramp Entry','Linear or circular ramp into stock for gradual engagement.','intermediate',ARRAY['programmer'],ARRAY['operator'],ARRAY['vmc'],ARRAY['end mill'],60),
  ('milling','3d-surfacing','3D Surfacing','Multi-axis surfacing for organic geometry, mold/die work.','advanced',ARRAY['machinist','programmer','toolmaker'],ARRAY['operator'],ARRAY['vmc','5-axis'],ARRAY['ball mill','bull nose'],70),
  ('milling','5-axis-positioning','5-Axis Positional (3+2)','Tilt and rotate then mill in 3 axes.','advanced',ARRAY['programmer','machinist'],ARRAY['operator','supervisor'],ARRAY['5-axis'],ARRAY['end mill','ball mill'],80),
  ('milling','5-axis-simultaneous','5-Axis Simultaneous','All 5 axes move together — undercuts, complex aerospace geometry.','expert',ARRAY['programmer','machinist'],ARRAY['supervisor','programmer'],ARRAY['5-axis'],ARRAY['ball mill','barrel mill'],90),
  ('milling','engraving','Engraving','Marking text/logos/serials with engraving cutter.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc'],ARRAY['engraving cutter','v-bit'],100),
  ('milling','chamfer-deburr-mill','Chamfer / Deburr (Milling)','Edge break with chamfer cutter or back-spot facer.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc'],ARRAY['chamfer mill','back chamfer'],110),
  ('turning','od-turning','OD Turning','Reduce outside diameter — roughing and finishing.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe','swiss'],ARRAY['turning insert','CNMG','DNMG'],10),
  ('turning','facing','Facing','Square the end of stock perpendicular to spindle.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['turning insert'],20),
  ('turning','id-boring','ID Boring','Enlarge or finish internal diameter with boring bar.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['boring bar','carbide insert'],30),
  ('turning','grooving-od','OD Grooving','Recessed groove on outside diameter.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['grooving insert','parting blade'],40),
  ('turning','grooving-id','ID Grooving','Internal grooving — retaining ring seats.','advanced',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['ID grooving tool'],50),
  ('turning','parting','Parting / Cut-Off','Sever finished part from stock with parting tool.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe','swiss'],ARRAY['parting blade'],60),
  ('turning','threading-single-point','Single-Point Threading','Generate thread by repeated synchronized passes.','advanced',ARRAY['machinist','programmer'],ARRAY['operator'],ARRAY['lathe'],ARRAY['threading insert'],70),
  ('turning','taper-turning','Taper Turning','Conical surface via compound, taper attachment, or G-code.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['turning insert'],80),
  ('turning','knurling','Knurling','Form/cut diamond or straight grip pattern.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['lathe'],ARRAY['knurling tool'],90),
  ('turning','live-tooling-mill','Live Tooling on Lathe','Rotating tools on turret for cross-drill, mill flats.','advanced',ARRAY['machinist','programmer'],ARRAY['operator','supervisor'],ARRAY['live-tool-lathe','swiss','mill-turn'],ARRAY['ER collet','live drill','live mill'],100),
  ('turning','swiss-turning','Swiss-Type Turning','Sliding headstock with guide bushing — long slender precision.','expert',ARRAY['machinist','programmer'],ARRAY['operator','supervisor'],ARRAY['swiss'],ARRAY['turning insert','live tool'],110),
  ('drilling-hole-making','spot-drilling','Spot Drilling','Center mark to prevent drill walk.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc','lathe'],ARRAY['spot drill','center drill'],10),
  ('drilling-hole-making','drilling-canned','Standard Drilling (G81)','Single-stroke drilling cycle.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc','lathe'],ARRAY['twist drill','carbide drill'],20),
  ('drilling-hole-making','peck-drilling','Peck Drilling (G83)','Cyclical retract for chip evacuation in deep holes.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['twist drill'],30),
  ('drilling-hole-making','reaming','Reaming','Finish hole to precise size and finish.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc','lathe'],ARRAY['reamer','adjustable reamer'],40),
  ('drilling-hole-making','tapping-rigid','Rigid Tapping (G84)','Synchronized spindle/feed to cut threads with tap.','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['tap','tap holder'],50),
  ('drilling-hole-making','tapping-form','Form Tapping','Cold-formed threads using fluteless tap (no chips).','intermediate',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['form tap'],60),
  ('drilling-hole-making','thread-milling','Thread Milling','Helical interpolation with single or multi-tooth thread mill.','advanced',ARRAY['machinist','programmer'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['thread mill'],70),
  ('drilling-hole-making','counterboring','Counterboring','Flat-bottom enlargement for socket-head fasteners.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['counterbore'],80),
  ('drilling-hole-making','countersinking','Countersinking','Conical recess for flat-head fasteners.','beginner',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc'],ARRAY['countersink'],90),
  ('drilling-hole-making','deep-hole-gundrill','Deep Hole / Gun Drilling','High L/D holes with coolant-through gun drill.','expert',ARRAY['machinist','programmer'],ARRAY['operator','supervisor'],ARRAY['gun-drill'],ARRAY['gun drill','BTA drill'],100),
  ('drilling-hole-making','boring-precision','Precision Boring','Single-point bore to exact size with adjustable boring head.','advanced',ARRAY['machinist'],ARRAY['operator'],ARRAY['vmc','hmc','lathe'],ARRAY['boring head','boring bar'],110),
  ('grinding','surface-grinding','Surface Grinding','Flat surface to tight tolerance with reciprocating wheel.','intermediate',ARRAY['machinist','grinder'],ARRAY['operator'],ARRAY['surface-grinder'],ARRAY['grinding wheel','magnetic chuck'],10),
  ('grinding','cylindrical-od','OD Cylindrical Grinding','Round OD finishing between centers or chuck.','advanced',ARRAY['grinder'],ARRAY['operator','supervisor'],ARRAY['cylindrical-grinder'],ARRAY['grinding wheel'],20),
  ('grinding','cylindrical-id','ID Cylindrical Grinding','Internal bore finishing with mounted wheel.','advanced',ARRAY['grinder'],ARRAY['operator'],ARRAY['id-grinder'],ARRAY['internal wheel'],30),
  ('grinding','centerless','Centerless Grinding','Through-feed or in-feed without centers — high volume.','advanced',ARRAY['grinder'],ARRAY['operator','supervisor'],ARRAY['centerless-grinder'],ARRAY['regulating wheel','grinding wheel'],40),
  ('grinding','jig-grinding','Jig Grinding','Precision hole/contour grinding for dies and gauges.','expert',ARRAY['toolmaker','grinder'],ARRAY['operator','supervisor'],ARRAY['jig-grinder'],ARRAY['mounted point'],50),
  ('edm','wire-edm','Wire EDM','Conductive wire cuts profile through plate.','advanced',ARRAY['edm','toolmaker'],ARRAY['operator','supervisor'],ARRAY['wire-edm'],ARRAY['brass wire','zinc-coated wire'],10),
  ('edm','sinker-ram-edm','Sinker (Ram) EDM','Shaped electrode burns cavity for mold/die.','expert',ARRAY['edm','toolmaker'],ARRAY['operator','supervisor'],ARRAY['ram-edm'],ARRAY['graphite electrode','copper electrode'],20),
  ('edm','small-hole-edm','Small-Hole EDM','Drill small or starter holes through hardened material.','advanced',ARRAY['edm'],ARRAY['operator'],ARRAY['hole-popper'],ARRAY['brass tube electrode'],30),
  ('gear-thread','gear-hobbing','Gear Hobbing','Generate spur/helical gear teeth with rotating hob.','expert',ARRAY['gear-cutter'],ARRAY['operator','supervisor'],ARRAY['hobbing-machine'],ARRAY['gear hob'],10),
  ('gear-thread','gear-shaping','Gear Shaping','Internal/external gear teeth with reciprocating cutter.','expert',ARRAY['gear-cutter'],ARRAY['operator','supervisor'],ARRAY['gear-shaper'],ARRAY['shaper cutter'],20),
  ('gear-thread','broaching','Broaching','Linear pull/push of multi-tooth tool — keyways, splines.','advanced',ARRAY['machinist'],ARRAY['operator','supervisor'],ARRAY['broach'],ARRAY['push broach','pull broach'],30),
  ('finishing-deburr','manual-deburr','Manual Deburr','Hand removal of burrs with files, scotch-brite, deburr tool.','beginner',ARRAY['machinist','assembler'],ARRAY['operator'],ARRAY['bench'],ARRAY['deburr tool','file','scotch-brite'],10),
  ('finishing-deburr','tumbling','Vibratory / Tumble Finishing','Mass finishing of small parts in media.','beginner',ARRAY['finisher'],ARRAY['operator'],ARRAY['tumbler','vibratory-bowl'],ARRAY['ceramic media','plastic media'],20),
  ('finishing-deburr','blasting','Bead / Sand Blasting','Surface texture or cleanup with abrasive blast cabinet.','beginner',ARRAY['finisher'],ARRAY['operator'],ARRAY['blast-cabinet'],ARRAY['glass bead','aluminum oxide'],30),
  ('finishing-deburr','polishing','Polishing / Buffing','Achieve mirror finish with progressive grit.','intermediate',ARRAY['finisher'],ARRAY['operator'],ARRAY['polishing-wheel'],ARRAY['buffing wheel','compound'],40),
  ('finishing-deburr','lapping','Lapping','Two surfaces with abrasive slurry — flatness < 1 µm.','advanced',ARRAY['toolmaker','finisher'],ARRAY['operator','supervisor'],ARRAY['lapping-plate'],ARRAY['diamond paste','lap'],50),
  ('finishing-deburr','honing','Honing','Cross-hatch finish in bores for hydraulic/engine cylinders.','advanced',ARRAY['machinist','finisher'],ARRAY['operator'],ARRAY['honing-machine'],ARRAY['honing stones'],60),
  ('specialty','waterjet','Waterjet','Abrasive water cutting — no HAZ, any material.','intermediate',ARRAY['waterjet-op'],ARRAY['operator','supervisor'],ARRAY['waterjet'],ARRAY['garnet abrasive','focusing tube'],10),
  ('specialty','laser-cutting','Laser Cutting','CO2 / fiber laser sheet cutting.','intermediate',ARRAY['laser-op'],ARRAY['operator','supervisor'],ARRAY['fiber-laser','co2-laser'],ARRAY['nozzle','assist gas'],20),
  ('specialty','additive-dmls','Additive (DMLS / SLM)','Powder-bed metal 3D printing.','expert',ARRAY['programmer','additive'],ARRAY['supervisor'],ARRAY['dmls','slm'],ARRAY['metal powder','build plate'],30)
) AS v(cat_slug,slug,name,short_description,difficulty,profession_tags,role_tags,machine_tags,typical_tooling,sort_order)
ON c.slug = v.cat_slug;