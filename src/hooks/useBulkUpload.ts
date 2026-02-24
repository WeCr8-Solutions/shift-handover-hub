import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrganization } from '@/hooks/useUserOrganization';
import { ParsedExcelData, parseExcelFile, ParseResult } from '@/lib/excelTemplates';
import { useToast } from '@/hooks/use-toast';

export interface UploadProgress {
  stage: 'idle' | 'parsing' | 'validating' | 'uploading' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
}

export interface UploadResult {
  teamsCreated: number;
  departmentsCreated: number;
  stationsCreated: number;
  workOrdersCreated: number;
  usersAddedToOrg: number;
  inviteCodesCreated: number;
  errors: string[];
  warnings: string[];
}

export function useBulkUpload() {
  const { user } = useAuth();
  const { organization, organizationRole } = useUserOrganization();
  const { toast } = useToast();
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'idle',
    message: '',
    current: 0,
    total: 0,
  });
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Check if user can perform bulk uploads (org admin/owner only)
  const canBulkUpload = useCallback(() => {
    if (!user || !organization) return false;
    return organizationRole === 'owner' || organizationRole === 'admin';
  }, [user, organization, organizationRole]);

  const resetState = useCallback(() => {
    setProgress({ stage: 'idle', message: '', current: 0, total: 0 });
    setParseResult(null);
    setUploadResult(null);
  }, []);

  const parseFile = useCallback(async (file: File) => {
    resetState();
    setProgress({ stage: 'parsing', message: 'Reading Excel file...', current: 0, total: 1 });

    try {
      const result = await parseExcelFile(file);
      setParseResult(result);
      setProgress({ 
        stage: result.errors.length > 0 ? 'error' : 'validating', 
        message: result.errors.length > 0 
          ? `Found ${result.errors.length} validation error(s)` 
          : 'File parsed successfully. Review the data below.',
        current: 1, 
        total: 1 
      });
      return result;
    } catch (error) {
      setProgress({ 
        stage: 'error', 
        message: error instanceof Error ? error.message : 'Failed to parse file', 
        current: 0, 
        total: 1 
      });
      return null;
    }
  }, [resetState]);

  const uploadData = useCallback(async (data: ParsedExcelData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to upload data.', variant: 'destructive' });
      return null;
    }

    if (!organization) {
      toast({ title: 'Error', description: 'You must belong to an organization to upload data.', variant: 'destructive' });
      return null;
    }

    if (!canBulkUpload()) {
      toast({ title: 'Error', description: 'Only organization admins can perform bulk uploads.', variant: 'destructive' });
      return null;
    }

    const result: UploadResult = {
      teamsCreated: 0,
      departmentsCreated: 0,
      stationsCreated: 0,
      workOrdersCreated: 0,
      usersAddedToOrg: 0,
      inviteCodesCreated: 0,
      errors: [],
      warnings: [],
    };

    const totalItems = data.teams.length + data.departments.length + data.stations.length + data.users.length + data.workOrders.length;
    let currentItem = 0;

    setProgress({ stage: 'uploading', message: 'Creating teams...', current: 0, total: totalItems });

    // ========== STEP 1: Create teams first (so we can reference them) ==========
    const teamNameToId: Record<string, string> = {};
    
    // Fetch existing teams for THIS organization only
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('organization_id', organization.id);
    
    existingTeams?.forEach(team => {
      teamNameToId[team.name.toLowerCase()] = team.id;
    });

    for (const team of data.teams) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating team: ${team.name}`, current: currentItem, total: totalItems });

      if (teamNameToId[team.name.toLowerCase()]) {
        result.warnings.push(`Team "${team.name}" already exists in your organization, skipping.`);
        continue;
      }

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({ 
          name: team.name, 
          description: team.description, 
          created_by: user.id,
          organization_id: organization.id
        })
        .select('id')
        .single();

      if (error) {
        result.errors.push(`Failed to create team "${team.name}": ${error.message}`);
      } else if (newTeam) {
        teamNameToId[team.name.toLowerCase()] = newTeam.id;
        result.teamsCreated++;

        // Add current user as owner of the team
        await supabase.from('team_members').insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'owner',
          organization_id: organization.id,
        });
      }
    }

    // ========== STEP 2: Create departments (depends on teams) ==========
    setProgress({ stage: 'uploading', message: 'Creating departments...', current: currentItem, total: totalItems });

    for (const dept of data.departments) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating department: ${dept.name}`, current: currentItem, total: totalItems });

      const teamId = dept.team_name ? teamNameToId[dept.team_name.toLowerCase()] : null;
      if (!teamId) {
        result.warnings.push(`Team "${dept.team_name}" not found for department "${dept.name}". Department will not be created.`);
        continue;
      }

      // Check if department already exists for this team
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', dept.name)
        .eq('team_id', teamId)
        .maybeSingle();

      if (existingDept) {
        result.warnings.push(`Department "${dept.name}" already exists for team "${dept.team_name}", skipping.`);
        continue;
      }

      const { error } = await supabase.from('departments').insert({
        name: dept.name,
        description: dept.description,
        team_id: teamId,
        organization_id: organization.id,
      });

      if (error) {
        result.errors.push(`Failed to create department "${dept.name}": ${error.message}`);
      } else {
        result.departmentsCreated++;
      }
    }

    // ========== STEP 3: Create stations ==========
    setProgress({ stage: 'uploading', message: 'Creating stations...', current: currentItem, total: totalItems });

    const stationIdToUuid: Record<string, string> = {};

    // Fetch existing stations for this organization
    const { data: existingStations } = await supabase
      .from('stations')
      .select('id, station_id')
      .eq('organization_id', organization.id);

    existingStations?.forEach(station => {
      stationIdToUuid[station.station_id.toLowerCase()] = station.id;
    });

    for (const station of data.stations) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating station: ${station.name}`, current: currentItem, total: totalItems });

      if (stationIdToUuid[station.station_id.toLowerCase()]) {
        result.warnings.push(`Station "${station.station_id}" already exists in your organization, skipping.`);
        continue;
      }

      const teamId = station.team_name ? teamNameToId[station.team_name.toLowerCase()] : null;
      if (station.team_name && !teamId) {
        result.warnings.push(`Team "${station.team_name}" not found for station "${station.station_id}". Station will be created without team assignment.`);
      }

      const { data: newStation, error } = await supabase.from('stations').insert({
        station_id: station.station_id,
        name: station.name,
        work_center: station.work_center,
        work_center_type: station.work_center_type,
        team_id: teamId,
        is_active: station.is_active,
        organization_id: organization.id,
      })
      .select('id')
      .single();

      if (error) {
        result.errors.push(`Failed to create station "${station.station_id}": ${error.message}`);
      } else if (newStation) {
        stationIdToUuid[station.station_id.toLowerCase()] = newStation.id;
        result.stationsCreated++;
      }
    }

    // ========== STEP 4: Process users - add existing to org, create invite codes for new ==========
    setProgress({ stage: 'uploading', message: 'Processing users...', current: currentItem, total: totalItems });

    // Helper to generate invite codes
    const generateInviteCode = (): string => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    for (const userEntry of data.users) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Processing user: ${userEntry.email}`, current: currentItem, total: totalItems });

      // Check if user already exists in the system
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('email', userEntry.email)
        .maybeSingle();

      if (existingProfile && existingProfile.user_id) {
        // User exists - check if already an org member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organization.id)
          .eq('user_id', existingProfile.user_id)
          .maybeSingle();

        if (existingMember) {
          result.warnings.push(`User "${userEntry.email}" is already a member of this organization, skipping.`);
          continue;
        }

        // Add to organization_members
        const orgRole = userEntry.org_role || 'member';
        const { error: orgMemberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: existingProfile.user_id,
            role: orgRole,
          });

        if (orgMemberError) {
          result.errors.push(`Failed to add "${userEntry.email}" to organization: ${orgMemberError.message}`);
          continue;
        }

        result.usersAddedToOrg++;

        // Add to team_members if team specified
        if (userEntry.team_name) {
          const teamId = teamNameToId[userEntry.team_name.toLowerCase()];
          if (teamId) {
            const teamRole = (userEntry.team_role || 'member') as 'owner' | 'admin' | 'member';
            const { error: teamMemberError } = await supabase
              .from('team_members')
              .insert([{
                team_id: teamId,
                user_id: existingProfile.user_id,
                role: teamRole,
                organization_id: organization.id,
              }]);

            if (teamMemberError && !teamMemberError.message.includes('duplicate')) {
              result.warnings.push(`Added "${userEntry.email}" to org but failed to add to team: ${teamMemberError.message}`);
            }
          }
        }

        // Assign app_role if specified (supervisor, operator, viewer)
        if (userEntry.role && userEntry.role !== 'operator') {
          const appRole = userEntry.role as 'admin' | 'supervisor' | 'operator' | 'viewer';
          // Check if role already exists
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', existingProfile.user_id)
            .eq('role', appRole)
            .maybeSingle();

          if (!existingRole) {
            await supabase
              .from('user_roles')
              .insert({ user_id: existingProfile.user_id, role: appRole });
          }
        }
      } else {
        // User doesn't exist - create an invite code for them
        const teamId = userEntry.team_name ? teamNameToId[userEntry.team_name.toLowerCase()] : null;
        const inviteCode = generateInviteCode();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        // Map app role for invite (only supervisor, operator, viewer are valid for invites)
        const validAppRoles = ['supervisor', 'operator', 'viewer'];
        const appRoleForInvite = userEntry.role && validAppRoles.includes(userEntry.role) 
          ? userEntry.role as 'supervisor' | 'operator' | 'viewer'
          : null;

        const { error: inviteError } = await supabase
          .from('organization_invites')
          .insert({
            organization_id: organization.id,
            team_id: teamId,
            invite_code: inviteCode,
            created_by: user.id,
            org_role: userEntry.org_role || 'member',
            app_role: appRoleForInvite,
            expires_at: expiresAt,
            max_uses: 1, // Single use for individual invites
            uses_count: 0,
            is_active: true,
          });

        if (inviteError) {
          result.errors.push(`Failed to create invite for "${userEntry.email}": ${inviteError.message}`);
        } else {
          result.inviteCodesCreated++;
          result.warnings.push(`Invite code ${inviteCode} created for "${userEntry.email}" (${userEntry.display_name}). Share this code so they can join.`);
        }
      }
    }

    // ========== STEP 5: Create work orders ==========
    setProgress({ stage: 'uploading', message: 'Creating work orders...', current: currentItem, total: totalItems });

    for (const workOrder of data.workOrders) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating work order: ${workOrder.work_order}`, current: currentItem, total: totalItems });

      // Check if work order already exists
      const { data: existingWO } = await supabase
        .from('queue_items')
        .select('id')
        .eq('work_order', workOrder.work_order)
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (existingWO) {
        result.warnings.push(`Work order "${workOrder.work_order}" already exists, skipping.`);
        continue;
      }

      // Resolve station ID if provided
      let stationUuid: string | null = null;
      if (workOrder.station_id) {
        stationUuid = stationIdToUuid[workOrder.station_id.toLowerCase()] || null;
        if (!stationUuid) {
          // Try to find station in database
          const { data: stationData } = await supabase
            .from('stations')
            .select('id')
            .eq('station_id', workOrder.station_id)
            .eq('organization_id', organization.id)
            .maybeSingle();
          
          if (stationData) {
            stationUuid = stationData.id;
          } else {
            result.warnings.push(`Station "${workOrder.station_id}" not found for work order "${workOrder.work_order}". Work order will be created without station assignment.`);
          }
        }
      }

      // Resolve team ID if provided
      let teamId: string | null = null;
      if (workOrder.team_name) {
        teamId = teamNameToId[workOrder.team_name.toLowerCase()] || null;
        if (!teamId) {
          result.warnings.push(`Team "${workOrder.team_name}" not found for work order "${workOrder.work_order}". Work order will be created without team assignment.`);
        }
      }

      // Parse due date
      let dueDate: string | null = null;
      if (workOrder.due_date) {
        // Try to parse the date
        const parsed = new Date(workOrder.due_date);
        if (!isNaN(parsed.getTime())) {
          dueDate = parsed.toISOString();
        }
      }

      // Build the insert object - cast to proper types
      const priorityValue = workOrder.priority as 'low' | 'normal' | 'high' | 'urgent' | 'critical';
      const statusValue = workOrder.status as 'pending' | 'queued' | 'in_progress' | 'on_hold';

      const { error } = await supabase.from('queue_items').insert({
        item_type: 'work_order' as const,
        title: workOrder.title,
        work_order: workOrder.work_order,
        part_number: workOrder.part_number || null,
        operation_number: workOrder.operation_number || null,
        quantity: workOrder.quantity || null,
        priority: priorityValue,
        status: statusValue,
        station_id: stationUuid,
        team_id: teamId,
        due_date: dueDate,
        estimated_duration: workOrder.estimated_duration || null,
        setup_time_minutes: (workOrder as any).setup_time_minutes || null,
        first_article_minutes: (workOrder as any).first_article_minutes || null,
        cycle_time_minutes: (workOrder as any).cycle_time_minutes || null,
        tags: workOrder.tags || null,
        description: workOrder.description || null,
        organization_id: organization.id,
        created_by: user.id,
      });

      if (error) {
        result.errors.push(`Failed to create work order "${workOrder.work_order}": ${error.message}`);
      } else {
        result.workOrdersCreated++;
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'station_created',
      description: `Bulk upload: ${result.teamsCreated} teams, ${result.departmentsCreated} departments, ${result.stationsCreated} stations, ${result.workOrdersCreated} work orders, ${result.usersAddedToOrg} users added, ${result.inviteCodesCreated} invites created`,
      metadata: {
        organization_id: organization.id,
        teams_created: result.teamsCreated,
        departments_created: result.departmentsCreated,
        stations_created: result.stationsCreated,
        work_orders_created: result.workOrdersCreated,
        users_added_to_org: result.usersAddedToOrg,
        invite_codes_created: result.inviteCodesCreated,
      },
    });

    setProgress({ 
      stage: 'complete', 
      message: 'Upload complete!', 
      current: totalItems, 
      total: totalItems 
    });

    setUploadResult(result);
    return result;
  }, [user, organization, canBulkUpload, toast]);

  return {
    progress,
    parseResult,
    uploadResult,
    parseFile,
    uploadData,
    resetState,
    canBulkUpload,
    organizationId: organization?.id,
    organizationName: organization?.name,
  };
}
