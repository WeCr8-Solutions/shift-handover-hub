DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'ncr_reports','quality_inspections','quality_checkpoints',
    'dimension_readings','dimension_check_requests',
    'routing_templates','setup_sheets','part_catalog',
    'equipment','maintenance_records','material_lots',
    'downtime_events','delivery_requests',
    'shift_assignments','announcements','announcement_reads',
    'organization_invites','organization_branding','organization_usage',
    'organization_machine_purchases','organization_audit_events',
    'operator_profiles','planning_chat_sessions','entitlements'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Platform admins can view all %I" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Platform admins can view all %I" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
      t, t
    );
  END LOOP;
END $$;