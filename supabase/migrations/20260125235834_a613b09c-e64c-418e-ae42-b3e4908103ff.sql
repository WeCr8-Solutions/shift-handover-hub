-- Add RLS policies to allow admins and supervisors to view all users and roles

-- Policy for admins/supervisors to view all profiles
CREATE POLICY "Admins and supervisors can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins/supervisors to view all user roles
CREATE POLICY "Admins and supervisors can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins to insert user roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy for admins to update user roles
CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins to delete user roles
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins/supervisors to view all teams
CREATE POLICY "Admins and supervisors can view all teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins to update any team
CREATE POLICY "Admins can update any team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins to delete any team
CREATE POLICY "Admins can delete any team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins/supervisors to view all team members
CREATE POLICY "Admins and supervisors can view all team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins to manage team members
CREATE POLICY "Admins can manage all team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all team members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins/supervisors to view all stations
CREATE POLICY "Admins and supervisors can view all stations"
  ON public.stations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins to manage all stations
CREATE POLICY "Admins can manage all stations"
  ON public.stations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all stations"
  ON public.stations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all stations"
  ON public.stations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins/supervisors to view all handoff records
CREATE POLICY "Admins and supervisors can view all handoff records"
  ON public.handoff_records FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Policy for admins/supervisors to view all station status
CREATE POLICY "Admins and supervisors can view all station status"
  ON public.current_station_status FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );