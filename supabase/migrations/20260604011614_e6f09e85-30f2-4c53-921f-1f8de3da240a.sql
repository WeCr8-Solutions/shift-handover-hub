-- Fix: Stations without team_id had their current_status hidden from org members
-- because existing read policies required a stations -> teams JOIN.
-- Add an org-scoped fallback that derives org access directly from stations.organization_id.

CREATE POLICY "Org members can view station status by org"
  ON public.current_station_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stations s
      WHERE s.id = current_station_status.station_id
        AND s.organization_id IS NOT NULL
        AND (
          public.is_org_member(auth.uid(), s.organization_id)
          OR public.is_supervisor_in_org(auth.uid(), s.organization_id)
        )
    )
  );

-- Mirror the same fix for INSERT/UPDATE so operators can write status on team-less stations
CREATE POLICY "Org members can modify station status by org"
  ON public.current_station_status
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stations s
      WHERE s.id = current_station_status.station_id
        AND s.organization_id IS NOT NULL
        AND public.is_org_member(auth.uid(), s.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.stations s
      WHERE s.id = current_station_status.station_id
        AND s.organization_id IS NOT NULL
        AND public.is_org_member(auth.uid(), s.organization_id)
    )
  );

CREATE POLICY "Org members can insert station status by org"
  ON public.current_station_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.stations s
      WHERE s.id = current_station_status.station_id
        AND s.organization_id IS NOT NULL
        AND public.is_org_member(auth.uid(), s.organization_id)
    )
  );
