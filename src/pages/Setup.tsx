import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { 
  ArrowRight, 
  Building2, 
  Users, 
  Wrench, 
  FileSpreadsheet, 
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SetupStatus {
  hasTeams: boolean;
  hasStations: boolean;
  hasTeamMembers: boolean;
  teamsCount: number;
  stationsCount: number;
  membersCount: number;
}

export default function Setup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    async function checkSetupStatus() {
      if (!user) return;
      
      const [teamsResult, stationsResult, membersResult] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('stations').select('id', { count: 'exact', head: true }),
        supabase.from('team_members').select('id', { count: 'exact', head: true }),
      ]);

      setSetupStatus({
        hasTeams: (teamsResult.count || 0) > 0,
        hasStations: (stationsResult.count || 0) > 0,
        hasTeamMembers: (membersResult.count || 0) > 0,
        teamsCount: teamsResult.count || 0,
        stationsCount: stationsResult.count || 0,
        membersCount: membersResult.count || 0,
      });
      setLoading(false);
    }

    checkSetupStatus();
  }, [user]);

  const refreshStatus = () => {
    setLoading(true);
    if (user) {
      Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('stations').select('id', { count: 'exact', head: true }),
        supabase.from('team_members').select('id', { count: 'exact', head: true }),
      ]).then(([teamsResult, stationsResult, membersResult]) => {
        setSetupStatus({
          hasTeams: (teamsResult.count || 0) > 0,
          hasStations: (stationsResult.count || 0) > 0,
          hasTeamMembers: (membersResult.count || 0) > 0,
          teamsCount: teamsResult.count || 0,
          stationsCount: stationsResult.count || 0,
          membersCount: membersResult.count || 0,
        });
        setLoading(false);
      });
    }
  };

  const completedSteps = setupStatus ? 
    (setupStatus.hasTeams ? 1 : 0) + 
    (setupStatus.hasStations ? 1 : 0) + 
    (setupStatus.hasTeamMembers ? 1 : 0) : 0;

  const progressPercent = (completedSteps / 3) * 100;

  const isSetupComplete = completedSteps === 3;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-secondary rounded w-1/2 mx-auto" />
              <div className="h-4 bg-secondary rounded w-3/4 mx-auto" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Setup Wizard
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isSetupComplete ? 'Setup Complete!' : 'Welcome to JobLine.ai'}
            </h1>
            <p className="text-muted-foreground">
              {isSetupComplete 
                ? 'Your manufacturing floor is ready. Start tracking handoffs now.'
                : 'Let\'s get your manufacturing floor set up in just a few steps.'}
            </p>
          </div>

          {/* Progress */}
          <Card data-tour="setup-progress">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Setup Progress</span>
                <span className="text-sm text-muted-foreground">{completedSteps}/3 complete</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          {/* Quick Setup Option */}
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent" data-tour="quick-setup">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Quick Setup with Excel
              </CardTitle>
              <CardDescription>
                Upload an Excel file with your teams, stations, and users to set everything up at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setBulkUploadOpen(true)} className="w-full sm:w-auto">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Bulk Upload Data
              </Button>
            </CardContent>
          </Card>

          {/* Manual Setup Steps */}
          <div className="space-y-4" data-tour="manual-steps">
            <h2 className="text-lg font-semibold">Or set up manually:</h2>

            {/* Step 1: Teams */}
            <Card className={setupStatus?.hasTeams ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {setupStatus?.hasTeams ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    )}
                    Create Teams
                  </CardTitle>
                  {setupStatus?.hasTeams && (
                    <Badge variant="secondary">{setupStatus.teamsCount} teams</Badge>
                  )}
                </div>
                <CardDescription>
                  Organize your workforce into teams (e.g., Day Shift, Night Shift, Welding Team).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={setupStatus?.hasTeams ? 'outline' : 'default'}
                  onClick={() => navigate('/teams')}
                >
                  {setupStatus?.hasTeams ? 'Manage Teams' : 'Create First Team'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Step 2: Stations */}
            <Card className={setupStatus?.hasStations ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {setupStatus?.hasStations ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Wrench className="w-5 h-5 text-muted-foreground" />
                    )}
                    Add Work Stations
                  </CardTitle>
                  {setupStatus?.hasStations && (
                    <Badge variant="secondary">{setupStatus.stationsCount} stations</Badge>
                  )}
                </div>
                <CardDescription>
                  Add your CNC machines, welding stations, inspection areas, and other equipment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={setupStatus?.hasStations ? 'outline' : 'default'}
                  onClick={() => navigate('/admin')}
                >
                  {setupStatus?.hasStations ? 'Manage Stations' : 'Add First Station'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Step 3: Team Members */}
            <Card className={setupStatus?.hasTeamMembers ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {setupStatus?.hasTeamMembers ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    )}
                    Invite Team Members
                  </CardTitle>
                  {setupStatus?.hasTeamMembers && (
                    <Badge variant="secondary">{setupStatus.membersCount} members</Badge>
                  )}
                </div>
                <CardDescription>
                  Add operators, supervisors, and other team members to start using JobLine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={setupStatus?.hasTeamMembers ? 'outline' : 'default'}
                  onClick={() => navigate('/teams')}
                >
                  {setupStatus?.hasTeamMembers ? 'Manage Members' : 'Invite Members'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Go to Dashboard */}
          {isSetupComplete && (
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
                <p className="text-muted-foreground mb-4">
                  Your manufacturing floor is configured and ready for shift handoffs.
                </p>
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  <Play className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BulkUploadDialog 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
        onComplete={refreshStatus}
      />
    </div>
  );
}
