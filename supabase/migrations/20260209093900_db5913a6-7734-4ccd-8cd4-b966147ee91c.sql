-- Comprehensive cleanup of all conflicting policies from stale migrations

-- Drop duplicate queue_items policies
DROP POLICY IF EXISTS "Team members can insert queue items" ON queue_items;

-- Clean up stations policies that might conflict
DROP POLICY IF EXISTS "Org admins can create org stations" ON stations;
DROP POLICY IF EXISTS "Org admins can create stations in their org" ON stations;
DROP POLICY IF EXISTS "Org and team admins can create stations" ON stations;

-- Clean up team_members policies that might conflict  
DROP POLICY IF EXISTS "Org admins can add team members in org" ON team_members;
DROP POLICY IF EXISTS "Team admins can add members in org" ON team_members;
DROP POLICY IF EXISTS "Org admins and team creators can add team members" ON team_members;