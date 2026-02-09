-- Migration: Add team-based queue_items INSERT policy for operators
-- This allows team members to create queue items via their team membership

-- Add policy for team members to create queue items through team membership
CREATE POLICY "Team members can create queue items via team"
ON queue_items FOR INSERT TO authenticated
WITH CHECK (
  -- Allow if user is a team member and the item is assigned to that team
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id
    WHERE t.id = queue_items.team_id 
    AND tm.user_id = auth.uid()
  ))
  -- Or if user is platform admin
  OR has_role(auth.uid(), 'admin')
);