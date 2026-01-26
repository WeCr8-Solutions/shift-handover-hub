import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ParsedExcelData, parseExcelFile, ParseResult, ValidationError } from '@/lib/excelTemplates';
import { useToast } from '@/hooks/use-toast';

export interface UploadProgress {
  stage: 'idle' | 'parsing' | 'validating' | 'uploading' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
}

export interface UploadResult {
  teamsCreated: number;
  stationsCreated: number;
  usersInvited: number;
  errors: string[];
  warnings: string[];
}

export function useBulkUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'idle',
    message: '',
    current: 0,
    total: 0,
  });
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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

    const result: UploadResult = {
      teamsCreated: 0,
      stationsCreated: 0,
      usersInvited: 0,
      errors: [],
      warnings: [],
    };

    const totalItems = data.teams.length + data.stations.length + data.users.length;
    let currentItem = 0;

    setProgress({ stage: 'uploading', message: 'Creating teams...', current: 0, total: totalItems });

    // Step 1: Create teams first (so we can reference them)
    const teamNameToId: Record<string, string> = {};
    
    // Fetch existing teams
    const { data: existingTeams } = await supabase.from('teams').select('id, name');
    existingTeams?.forEach(team => {
      teamNameToId[team.name.toLowerCase()] = team.id;
    });

    for (const team of data.teams) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating team: ${team.name}`, current: currentItem, total: totalItems });

      if (teamNameToId[team.name.toLowerCase()]) {
        result.warnings.push(`Team "${team.name}" already exists, skipping.`);
        continue;
      }

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({ name: team.name, description: team.description, created_by: user.id })
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
        });
      }
    }

    // Step 2: Create stations
    setProgress({ stage: 'uploading', message: 'Creating stations...', current: currentItem, total: totalItems });

    for (const station of data.stations) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Creating station: ${station.name}`, current: currentItem, total: totalItems });

      // Check if station already exists
      const { data: existing } = await supabase
        .from('stations')
        .select('id')
        .eq('station_id', station.station_id)
        .maybeSingle();

      if (existing) {
        result.warnings.push(`Station "${station.station_id}" already exists, skipping.`);
        continue;
      }

      const teamId = station.team_name ? teamNameToId[station.team_name.toLowerCase()] : null;
      if (station.team_name && !teamId) {
        result.warnings.push(`Team "${station.team_name}" not found for station "${station.station_id}". Station will be created without team assignment.`);
      }

      const { error } = await supabase.from('stations').insert({
        station_id: station.station_id,
        name: station.name,
        work_center: station.work_center,
        work_center_type: station.work_center_type,
        team_id: teamId,
        is_active: station.is_active,
      });

      if (error) {
        result.errors.push(`Failed to create station "${station.station_id}": ${error.message}`);
      } else {
        result.stationsCreated++;
      }
    }

    // Step 3: Create user invitations (stored for reference - actual invite would need email system)
    setProgress({ stage: 'uploading', message: 'Preparing user invitations...', current: currentItem, total: totalItems });

    for (const userEntry of data.users) {
      currentItem++;
      setProgress({ stage: 'uploading', message: `Processing user: ${userEntry.email}`, current: currentItem, total: totalItems });

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEntry.email)
        .maybeSingle();

      if (existingProfile) {
        result.warnings.push(`User "${userEntry.email}" already exists, skipping.`);
        continue;
      }

      // For now, just count them - actual user creation would require auth.admin
      // This would typically be done via edge function with admin privileges
      result.usersInvited++;
      result.warnings.push(`User "${userEntry.email}" queued for invitation. Note: Actual invitation requires email system setup.`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'station_created',
      description: `Bulk upload: ${result.teamsCreated} teams, ${result.stationsCreated} stations`,
      metadata: {
        teams_created: result.teamsCreated,
        stations_created: result.stationsCreated,
        users_invited: result.usersInvited,
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
  }, [user, toast]);

  return {
    progress,
    parseResult,
    uploadResult,
    parseFile,
    uploadData,
    resetState,
  };
}
