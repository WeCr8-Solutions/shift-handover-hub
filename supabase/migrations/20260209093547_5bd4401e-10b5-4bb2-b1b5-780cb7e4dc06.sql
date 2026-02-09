-- Simple team-based queue items insert policy (avoiding complex joins that cause cycles)
CREATE POLICY "Team members can insert queue items"
ON queue_items FOR INSERT TO authenticated
WITH CHECK (
  team_id IS NOT NULL 
  AND is_team_member(auth.uid(), team_id)
);