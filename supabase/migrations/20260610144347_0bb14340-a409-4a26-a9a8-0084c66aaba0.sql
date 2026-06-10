CREATE OR REPLACE FUNCTION public.repair_seed_aymar_concierge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _org_id uuid := '41f0e268-87d6-4981-b21e-a3c4e8245688';
  _owner_user_id uuid := '7d924865-7e19-4bf8-a503-75eeeab26d03';
  _member_id uuid := 'e8e894ba-ea12-410e-b355-35c10e07b5ae';
  _engagement_id uuid := '631b1d16-18c1-4cc9-b1a0-2886029e4c5c';
  _team_id uuid := 'e4c70727-20b3-465e-bdf2-e88158c908cf';
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (public.has_role(_caller, 'admin'::public.app_role) OR public.has_role(_caller, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Platform admin or developer access required';
  END IF;

  INSERT INTO public.organizations (id, name, slug, description, logo_url, billing_email, subscription_status, subscription_tier, created_by, created_at, updated_at, stripe_customer_id, trial_ends_at, mfa_required, requires_us_person_declaration, designated_oap_mentor_user_id, ai_enabled, organization_kind, public_slug, public_employer, employer_tagline, employer_about, employer_logo_url, employer_cover_url, employer_website, employer_linkedin, employer_hiring_email, employer_locations, employer_industries, employer_paid_contact, employer_paid_contact_until, employer_ideal_roles, employer_ideal_skills, employer_ideal_certs, employer_ideal_machines, employer_ideal_experience_min, employer_ideal_notes, oap_default_recert_months, is_jobline_approved_verifier, is_jobline_approved_vendor, is_jobline_approved_mentor, verifier_display_name, verifier_tagline, verifier_approved_at, onboarding_status, onboarding_engagement_id, activation_state, opened_for_operations_at, opened_for_operations_by, claimed_at, claimed_by_user_id)
  VALUES (_org_id, 'Aymar Engineering', 'aymar-engineering', NULL, NULL, 'brandon@revgrips.com', 'trialing', 'team', _owner_user_id, '2026-06-08T19:27:22.412824+00:00', '2026-06-09T15:14:06.785065+00:00', NULL, '2026-06-22T19:27:22.412824+00:00', FALSE, FALSE, NULL, FALSE, 'manufacturer', NULL, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::text[], '{}'::text[], FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12, FALSE, FALSE, FALSE, NULL, NULL, NULL, 'concierge_in_progress', _engagement_id, 'claimed', NULL, NULL, NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET billing_email = EXCLUDED.billing_email, subscription_status = EXCLUDED.subscription_status, subscription_tier = EXCLUDED.subscription_tier, onboarding_status = EXCLUDED.onboarding_status, onboarding_engagement_id = EXCLUDED.onboarding_engagement_id, activation_state = EXCLUDED.activation_state, updated_at = now();

  INSERT INTO public.organization_members (id, organization_id, user_id, role, joined_at)
  VALUES (_member_id, _org_id, _owner_user_id, 'owner', '2026-06-09T21:51:00.786456+00:00')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET id = EXCLUDED.id, role = EXCLUDED.role, joined_at = COALESCE(public.organization_members.joined_at, EXCLUDED.joined_at);

  INSERT INTO public.teams (id, name, description, created_by, created_at, updated_at, organization_id)
  VALUES (_team_id, 'Production', 'Default production team', _owner_user_id, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id)
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, name = EXCLUDED.name, description = EXCLUDED.description, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.departments (id, team_id, name, description, created_at, updated_at, organization_id) VALUES
   ('39d96f62-a1e2-48d1-a6f9-1fdb450004e8', _team_id, 'Office', 'Front office, planning, sales', '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id),
   ('8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _team_id, 'CNC Operations', 'Milling, turning, 5-axis, honing', '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id),
   ('b8988128-bf2c-4445-8b27-07b63109e87f', _team_id, 'Welding & Assembly', 'Weld and assembly bench operations', '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id),
   ('35757b0c-af4a-44f8-9e52-a6d81854d0d8', _team_id, 'Shipping & Receiving', 'Inbound/outbound material handling', '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id),
   ('55c6f48f-e555-40b5-b02e-2dc67e7230f1', _team_id, 'Quality / Inspection', 'CMM, first-article and final inspection', '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', _org_id)
  ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id, name = EXCLUDED.name, description = EXCLUDED.description, organization_id = EXCLUDED.organization_id, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.stations (id, team_id, station_id, name, work_center, work_center_type, is_active, created_at, updated_at, department_id, organization_id, daily_capacity_hours) VALUES
   ('83553a1c-53c0-4ed6-986b-128876617522', _team_id, 'OFFICE-01', 'Front Office', 'OFFICE', 'office', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '39d96f62-a1e2-48d1-a6f9-1fdb450004e8', _org_id, 8),
   ('7baf700a-1931-4689-8228-0f828ee7e078', _team_id, 'WELD-01', 'Weld Bay', 'WELD', 'welding', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', 'b8988128-bf2c-4445-8b27-07b63109e87f', _org_id, 8),
   ('f8dc9658-ea7f-489b-b095-3b59570b3978', _team_id, 'ASSY-01', 'Assembly Bench', 'ASSY', 'assembly', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', 'b8988128-bf2c-4445-8b27-07b63109e87f', _org_id, 8),
   ('9b72e49d-dfb4-4289-b050-6b80f1f40b44', _team_id, 'RECV-01', 'Receiving', 'RECV', 'receiving', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '35757b0c-af4a-44f8-9e52-a6d81854d0d8', _org_id, 8),
   ('183b4119-4fb4-4cc1-81a1-a64af05c6d5d', _team_id, 'SHIP-01', 'Shipping', 'SHIP', 'shipping', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '35757b0c-af4a-44f8-9e52-a6d81854d0d8', _org_id, 8),
   ('1c4cb7f1-128f-4e5b-82ae-1a005c9848cd', _team_id, 'INSP-01', 'Inspection Bench', 'INSP', 'inspection', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '55c6f48f-e555-40b5-b02e-2dc67e7230f1', _org_id, 8),
   ('9ba01f77-d0d9-4201-8f46-171406365f6a', _team_id, 'VF3SS-4811', 'Haas VF-3SS (4811)', 'CNC_MILL', 'cnc_mill', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('5694b8a1-a515-45c5-b99c-547111d5977f', _team_id, 'ST20Y-1533', 'Haas ST-20Y (1533)', 'CNC_LATHE', 'cnc_lathe', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('b93e98f3-2010-411e-9bc9-083b6b4d8db8', _team_id, 'ST20Y-2291', 'Haas ST-20Y (2291)', 'CNC_LATHE', 'cnc_lathe', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('b744db10-51e6-4cfc-9305-6c18468aee06', _team_id, 'VF2SSYT-4060', 'Haas VF-2SSYT (4060)', 'CNC_MILL', 'cnc_mill', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('f2ccc278-7899-4fc1-9cd6-1945960d82ac', _team_id, 'VF2D-6634', 'Haas VF-2D (6634)', 'CNC_MILL', 'cnc_mill', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('ba8bd8ef-a18b-41e2-aba3-2aa4f730e3c5', _team_id, 'MINIMILL-9736', 'Haas Mini Mill (9736)', 'CNC_MILL', 'cnc_mill', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('cad0be28-89e3-49e6-b447-2bc2a4b1844f', _team_id, 'SL30T-3618', 'Haas SL-30T (3618)', 'CNC_LATHE', 'cnc_lathe', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('56c42384-9add-437f-b992-2a50bcee1383', _team_id, 'ST35Y-8728', 'Haas ST-35Y (8728)', 'CNC_LATHE', 'cnc_lathe', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('24525263-b1db-4383-a361-cfd6c9a6a262', _team_id, 'ST20Y-1220', 'Haas ST-20Y (1220)', 'CNC_LATHE', 'cnc_lathe', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('75999f87-550b-4d9a-a835-b6f8087e5250', _team_id, 'UMC500SS-1834', 'Haas UMC-500SS (1834)', 'CNC_MILL_5AXIS', 'cnc_mill_5axis', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8),
   ('a769104a-2217-46a2-8f0f-329b639f8b2f', _team_id, 'SV300SERIES-0001', 'Sunnen SV-300 Series (0001)', 'HONING', 'honing', TRUE, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:36:48.544242+00:00', '8b2e8bbe-a82a-4c42-ae2b-3ef70d768384', _org_id, 8)
  ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id, station_id = EXCLUDED.station_id, name = EXCLUDED.name, work_center = EXCLUDED.work_center, work_center_type = EXCLUDED.work_center_type, is_active = EXCLUDED.is_active, department_id = EXCLUDED.department_id, organization_id = EXCLUDED.organization_id, daily_capacity_hours = EXCLUDED.daily_capacity_hours, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.onboarding_engagements (id, organization_id, purchased_via, stripe_payment_intent_id, plan_tier, assigned_admin_id, status, percent_complete, notes, started_at, ready_at, went_live_at, created_by, created_at, updated_at, payment_status, payment_method, payment_reference, payment_amount_cents, payment_received_at, payment_recorded_by, payment_proof_path, contract_signed_at, contract_signer_name, contract_signer_title, contract_proof_path, sales_rep_id, refunded_at, refunded_by, refund_amount_cents, refund_reason, refund_method, refund_reference, refund_proof_path, exported_to_accounting_at, customer_tax_id, customer_billing_address, invoice_number)
  VALUES (_engagement_id, _org_id, 'manual', NULL, 'standard', _owner_user_id, 'in_progress', 56, 'Initial concierge intake — machine inventory imported from Aymar_Engineering_Machines.xlsx (11 machines).', '2026-06-08T19:27:22.412824+00:00', NULL, NULL, _owner_user_id, '2026-06-08T19:27:22.412824+00:00', '2026-06-09T15:48:05.386446+00:00', 'unpaid', NULL, NULL, 150000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'INV-202606-631B1D')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, purchased_via = EXCLUDED.purchased_via, plan_tier = EXCLUDED.plan_tier, assigned_admin_id = EXCLUDED.assigned_admin_id, status = EXCLUDED.status, percent_complete = EXCLUDED.percent_complete, notes = EXCLUDED.notes, payment_status = EXCLUDED.payment_status, payment_amount_cents = EXCLUDED.payment_amount_cents, invoice_number = EXCLUDED.invoice_number, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.onboarding_intake_responses (id, engagement_id, organization_id, module_key, payload, submitted_by, submitted_at, version, created_at, updated_at) VALUES
   ('6aefd210-57b6-4f67-8772-45ab5422e138', _engagement_id, _org_id, 'equipment', '{"count": 11, "machines": [{"type": "cnc_mill", "hertz": "50/60", "model": "VF-3SS", "phase": "3", "serial": "1164811", "voltage": "220", "mfg_date": "2019-06", "full_load": 70, "largest_load": 55, "manufacturer": "Haas"}, {"type": "cnc_lathe", "hertz": "50/60", "model": "ST-20Y", "phase": "3", "serial": "3111533", "voltage": "220", "mfg_date": "2019-07", "full_load": 40, "largest_load": 35, "manufacturer": "Haas"}, {"type": "cnc_lathe", "hertz": "50/60", "model": "ST-20Y", "phase": "3", "serial": "3112291", "voltage": "220", "mfg_date": "2018-10", "full_load": 70, "largest_load": 65, "manufacturer": "Haas"}, {"type": "cnc_mill", "hertz": "50/60", "model": "VF-2SSYT", "phase": "3", "serial": "1134060", "voltage": "220", "mfg_date": "2016-11", "full_load": 70, "largest_load": 55, "manufacturer": "Haas"}, {"type": "cnc_mill", "hertz": "50/60", "model": "VF-2D", "phase": "3", "serial": "46634", "voltage": "208/230", "mfg_date": "2005-11", "full_load": 40, "largest_load": 35, "manufacturer": "Haas"}, {"type": "cnc_mill", "hertz": "50/60", "model": "Mini Mill", "phase": "3/1", "serial": "49736", "voltage": "208/230", "mfg_date": "2006-05", "full_load": "25/40", "largest_load": 15, "manufacturer": "Haas"}, {"type": "cnc_lathe", "hertz": "50/60", "model": "SL-30T", "phase": "3", "serial": "73618", "voltage": "208/230", "mfg_date": "2006-05", "full_load": 80, "largest_load": 70, "manufacturer": "Haas"}, {"type": "cnc_lathe", "hertz": "50/60", "model": "ST-35Y", "phase": "3", "serial": "3138728", "voltage": "220", "mfg_date": "2024-10", "full_load": 70, "largest_load": 65, "manufacturer": "Haas"}, {"type": "cnc_lathe", "hertz": "50/60", "model": "ST-20Y", "phase": "3", "serial": "3121220", "voltage": "220", "mfg_date": "2021-04", "full_load": 25, "largest_load": 15, "manufacturer": "Haas"}, {"type": "cnc_mill_5axis", "hertz": "50/60", "model": "UMC-500SS", "phase": "3", "serial": "1221834", "voltage": "220", "mfg_date": "2024-10", "full_load": 70, "largest_load": 65, "manufacturer": "Haas"}, {"type": "honing", "hertz": "50/60", "model": "Sunnen SV-300 Series", "phase": "3", "serial": "2LL-10001", "voltage": "460", "mfg_date": "2012", "full_load": 59, "largest_load": 17, "manufacturer": "Sunnen"}], "source_file": "Aymar_Engineering_Machines.xlsx"}'::jsonb, _owner_user_id, '2026-06-08T19:27:22.412824+00:00', 1, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00'),
   ('f0dfd05b-c8ff-4bfa-84c4-66f7659d75cb', _engagement_id, _org_id, 'users_roles', '{"owner": {"name": "Brandon Aymar", "role": "admin", "email": "brandon@revgrips.com", "app_role": "admin", "invite_code": "AYMAR-OWNER-BA01"}, "operators": [{"name": "Cory C.", "role": "operator", "email": "cory@revgrips.com", "app_role": "operator", "invite_code": "AYMAR-OP-CC03"}], "supervisors": [{"name": "Jaime S.", "role": "supervisor", "email": "jaimes@revgrips.com", "app_role": "supervisor", "invite_code": "AYMAR-SUP-JS02"}]}'::jsonb, _owner_user_id, '2026-06-08T19:41:17.520336+00:00', 1, '2026-06-08T19:41:17.520336+00:00', '2026-06-09T15:47:57.019558+00:00')
  ON CONFLICT (engagement_id, module_key) DO UPDATE SET id = EXCLUDED.id, organization_id = EXCLUDED.organization_id, payload = EXCLUDED.payload, submitted_by = EXCLUDED.submitted_by, submitted_at = EXCLUDED.submitted_at, version = EXCLUDED.version, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.onboarding_checklist_items (id, engagement_id, organization_id, module_key, label, sort_order, required, status, customer_blocker_note, completed_by, completed_at, created_at, updated_at) VALUES
   ('54bbf6ef-c8fd-4e04-a46f-9136e0cbf2d6', _engagement_id, _org_id, 'equipment', 'Equipment & machine registry uploaded', 20, TRUE, 'done', NULL, _owner_user_id, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00'),
   ('d0819b05-5e24-422d-a5f6-431de76fbbaa', _engagement_id, _org_id, 'training', 'Training programs & OAP enrollments seeded', 80, TRUE, 'todo', NULL, NULL, NULL, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00'),
   ('50092e94-7c7e-4cb1-b0b8-607bfb9ef807', _engagement_id, _org_id, 'documents', 'Policies, manuals & setup sheets uploaded', 90, TRUE, 'todo', NULL, NULL, NULL, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00'),
   ('ce7c2746-631a-4895-a00a-d1115bbb8422', _engagement_id, _org_id, 'review', 'Final review & customer handoff', 100, TRUE, 'todo', NULL, NULL, NULL, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:27:22.412824+00:00'),
   ('f64dc866-2557-4d2f-8995-92c0be2074f4', _engagement_id, _org_id, 'stations', 'Departments & stations configured', 30, TRUE, 'done', NULL, NULL, '2026-06-08T19:36:48.544242+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:36:48.544242+00:00'),
   ('15ac0ec6-23f9-4b0a-b142-613ca7b2aa47', _engagement_id, _org_id, 'routing', 'Routing templates loaded', 50, TRUE, 'done', 'Seeded Basic Shop Routing + optional AS9100/ISO 9001 Ready template. Customer can clone/edit per part family.', NULL, '2026-06-08T19:48:53.518115+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:48:53.518115+00:00'),
   ('561f78ed-0d85-414c-9664-09c4053f536d', _engagement_id, _org_id, 'quality', 'Quality checkpoints & inspection tools set', 60, TRUE, 'done', 'Seeded First Article, In-Process, and Final checkpoints. Tune thresholds during go-live.', NULL, '2026-06-08T19:48:53.518115+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:48:53.518115+00:00'),
   ('5956d4ae-1c4d-459c-8897-f21d486343d5', _engagement_id, _org_id, 'org_profile', 'Organization profile, branding, ITAR posture', 10, TRUE, 'blocked', 'Awaiting customer: logo, business address, confirmation on ITAR/AS9100 posture. Concierge can complete on request. ISO 9001 is optional - AS9100/ISO 9001 Ready routing template is pre-loaded for when they are ready.', NULL, NULL, '2026-06-08T19:27:22.412824+00:00', '2026-06-08T19:48:53.518115+00:00'),
   ('8c02739d-407c-467a-a949-b9e0ccfd29a0', _engagement_id, _org_id, 'erp', 'ERP / integrations configured', 70, FALSE, 'done', 'Default mode: Native (Lovable Cloud). Customer can opt into JobBOSS or SAP later from Settings -> Integrations.', _owner_user_id, '2026-06-08T21:19:56.263+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-08T21:19:56.51454+00:00'),
   ('3846b452-f319-414c-992c-320192bdbd1b', _engagement_id, _org_id, 'users_roles', 'Users, roles, and invites generated', 40, TRUE, 'done', NULL, _owner_user_id, '2026-06-09T15:48:04.68+00:00', '2026-06-08T19:27:22.412824+00:00', '2026-06-09T15:48:05.386446+00:00')
  ON CONFLICT (id) DO UPDATE SET engagement_id = EXCLUDED.engagement_id, organization_id = EXCLUDED.organization_id, module_key = EXCLUDED.module_key, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, required = EXCLUDED.required, status = EXCLUDED.status, customer_blocker_note = EXCLUDED.customer_blocker_note, completed_by = EXCLUDED.completed_by, completed_at = EXCLUDED.completed_at, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.concierge_activity_log (id, organization_id, actor_user_id, actor_role, action, summary, details, created_at)
  VALUES ('e94a68bc-9651-4a8b-945b-e6c4db4f4d77', _org_id, NULL, NULL, 'billing_email_set', NULL, '{"source": "direct_repair_no_legacy", "owner_email": "brandon@revgrips.com", "billing_email": "brandon@revgrips.com", "delegate_email": "jaimes@revgrips.com"}'::jsonb, '2026-06-09T15:14:06.785065+00:00')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, details = EXCLUDED.details;

  UPDATE public.organizations
  SET onboarding_engagement_id = _engagement_id,
      onboarding_status = 'concierge_in_progress',
      activation_state = 'claimed',
      updated_at = now()
  WHERE id = _org_id;

  RETURN jsonb_build_object(
    'organization_id', _org_id,
    'organizations', (SELECT count(*) FROM public.organizations WHERE id = _org_id),
    'members', (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id),
    'owner_membership', (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id AND user_id = _owner_user_id),
    'engagements', (SELECT count(*) FROM public.onboarding_engagements WHERE organization_id = _org_id),
    'intake_responses', (SELECT count(*) FROM public.onboarding_intake_responses WHERE organization_id = _org_id),
    'checklist_items', (SELECT count(*) FROM public.onboarding_checklist_items WHERE engagement_id = _engagement_id),
    'teams', (SELECT count(*) FROM public.teams WHERE organization_id = _org_id),
    'departments', (SELECT count(*) FROM public.departments WHERE organization_id = _org_id),
    'stations', (SELECT count(*) FROM public.stations WHERE organization_id = _org_id),
    'onboarding_engagement_id_set', (SELECT onboarding_engagement_id = _engagement_id FROM public.organizations WHERE id = _org_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge() FROM anon;
GRANT EXECUTE ON FUNCTION public.repair_seed_aymar_concierge() TO authenticated;