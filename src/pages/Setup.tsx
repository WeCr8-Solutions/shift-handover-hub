import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { OrganizationSetup } from '@/components/onboarding/OrganizationSetup';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { useDataSourceMode } from '@/hooks/useDataSourceMode';
import {
  ArrowRight,
  Building2,
  Users,
  Wrench,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Play,
  LayoutDashboard,
  ClipboardList,
  UserCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SetupStatus {
  hasOrganization: boolean;
  hasTeams: boolean;
  hasStations: boolean;
  hasTeamMembers: boolean;
  hasWorkOrders: boolean;
  organizationName: string | null;
  teamsCount: number;
  stationsCount: number;
  membersCount: number;
  workOrdersCount: number;
}

export default function Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const verifiedToastFiredRef = useRef(false);
  const { user, loading: authLoading, isReady } = useAuth();
  const { completeStep, startTour, showTour, isComplete: onboardingComplete, currentStep, dismissSetupWizard, markWelcomeSeen, setupWizardDismissed, isLoading: onboardingLoading } = useOnboardingContext();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  // F-4: detect talent-only users who land on /setup without ?intent=create_org
  const [hasTalentProfile, setHasTalentProfile] = useState(false);

  // G1: One-time "email verified" success toast when user lands from verification email
  useEffect(() => {
    if (verifiedToastFiredRef.current) return;
    if (searchParams.get('verified') !== '1') return;
    if (!isReady || !user) return; // wait until session is hydrated to avoid auth-redirect race
    verifiedToastFiredRef.current = true;
    toast({
      title: 'Email verified',
      description: "Welcome aboard — let's finish setting up your shop.",
    });
    // Strip query param so the toast doesn't re-fire on remount
    const next = new URLSearchParams(searchParams);
    next.delete('verified');
    setSearchParams(next, { replace: true });
  }, [isReady, user, searchParams, setSearchParams, toast]);

  useEffect(() => {
    // G2: Don't redirect to /auth while session is still hydrating from a verification deep-link.
    // `isReady` is true once initial getSession() resolves; only then is `!user` authoritative.
    if (isReady && !user) {
      navigate('/auth');
      return;
    }
    // Respect "Don't show again" — redirect to dashboard
    if (isReady && !onboardingLoading && user && setupWizardDismissed) {
      navigate('/dashboard', { replace: true });
    }
  }, [isReady, onboardingLoading, user, setupWizardDismissed, navigate]);


  const fetchSetupStatus = async (showLoader = true) => {
    if (!user) return;
    if (showLoader) setLoading(true);

    try {
      const orgResult = await supabase
        .from('organization_members')
        .select('organization:organizations(id, name)')
        .eq('user_id', user.id)
        .maybeSingle();

      // F-4: check if this user has a talent profile (operator_profiles row)
      const { count: talentCount } = await supabase
        .from('operator_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setHasTalentProfile((talentCount ?? 0) > 0);

      const hasOrg = !!orgResult.data?.organization;
      const orgId = orgResult.data?.organization?.id;

      const [teamsResult, stationsResult, membersResult, workOrdersResult] = await Promise.all([
        orgId
          ? supabase.from('teams').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
          : Promise.resolve({ count: 0 }),
        orgId
          ? supabase.from('stations').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
          : Promise.resolve({ count: 0 }),
        orgId
          ? supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
          : Promise.resolve({ count: 0 }),
        orgId
          ? supabase.from('queue_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
          : Promise.resolve({ count: 0 }),
      ]);

      setSetupStatus({
        hasOrganization: hasOrg,
        organizationName: orgResult.data?.organization?.name || null,
        hasTeams: (teamsResult.count || 0) > 0,
        hasStations: (stationsResult.count || 0) > 0,
        hasTeamMembers: (membersResult.count || 0) > 0,
        hasWorkOrders: (workOrdersResult.count || 0) > 0,
        teamsCount: teamsResult.count || 0,
        stationsCount: stationsResult.count || 0,
        membersCount: membersResult.count || 0,
        workOrdersCount: workOrdersResult.count || 0,
      });

      if (!hasOrg && (currentStep === 'organization-setup' || currentStep === 'welcome')) {
        setShowOrgSetup(true);
      }
    } catch (error) {
      console.error('Error fetching setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetupStatus();
  }, [user]);

  const refreshStatus = () => fetchSetupStatus(true);

  const handleOrgSetupComplete = async () => {
    setShowOrgSetup(false);
    await completeStep('organization-setup');
    // Mark welcome as seen so user won't be redirected back to setup
    await markWelcomeSeen();
    refreshStatus();
  };

  const { isReadThrough: erpReadThrough, vendor: erpVendor } = useDataSourceMode();
  // G6: ERP read-through orgs (JobBOSS/SAP) never write to queue_items, so treat the
  // "first work order" step as auto-complete — their orders live in the source system.
  const workOrdersStepDone = !!setupStatus?.hasWorkOrders || erpReadThrough;

  const completedSteps = setupStatus ?
    (setupStatus.hasOrganization ? 1 : 0) +
    (setupStatus.hasTeams ? 1 : 0) +
    (setupStatus.hasStations ? 1 : 0) +
    (setupStatus.hasTeamMembers ? 1 : 0) +
    (workOrdersStepDone ? 1 : 0) : 0;

  const progressPercent = (completedSteps / 5) * 100;

  const isSetupComplete = completedSteps === 5;


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

  // F-4: talent-only user landing on /setup without explicit org-creation intent
  // Show a chooser so they don't accidentally self-elevate to org_admin.
  const intentParam = searchParams.get('intent');
  if (
    !loading &&
    hasTalentProfile &&
    !setupStatus?.hasOrganization &&
    intentParam !== 'create_org'
  ) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto space-y-6 text-center">
            <h1 className="text-2xl font-bold">What would you like to do?</h1>
            <p className="text-muted-foreground text-sm">
              You already have a talent profile on JobLine. Choose how you'd like to continue.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate('/talent/dashboard')}
              >
                <CardContent className="pt-6 space-y-2">
                  <UserCircle2 className="w-8 h-8 text-primary" />
                  <CardTitle className="text-base">Continue as Talent</CardTitle>
                  <CardDescription>
                    View your operator profile, certifications, and job opportunities.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('intent', 'create_org');
                  setSearchParams(next, { replace: true });
                }}
              >
                <CardContent className="pt-6 space-y-2">
                  <Building2 className="w-8 h-8 text-primary" />
                  <CardTitle className="text-base">Set up a Shop</CardTitle>
                  <CardDescription>
                    Create an organization to manage handoffs, teams, and job queues.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show organization setup modal
  if (showOrgSetup) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-lg mx-auto">
            <OrganizationSetup 
              onComplete={handleOrgSetupComplete}
              onSkip={async () => {
                setShowOrgSetup(false);
                await completeStep('organization-setup');
                await markWelcomeSeen();
              }}
            />
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
                <span className="text-sm text-muted-foreground">{completedSteps}/5 complete</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          {/* Step 0: Organization */}
          <Card className={setupStatus?.hasOrganization ? 'border-green-500/50' : 'border-primary/50'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {setupStatus?.hasOrganization ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary" />
                  )}
                  Organization
                </CardTitle>
                {setupStatus?.hasOrganization && (
                  <Badge variant="secondary">{setupStatus.organizationName}</Badge>
                )}
              </div>
              <CardDescription>
                Your company workspace - keeps your data isolated and secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={setupStatus?.hasOrganization ? 'outline' : 'default'}
                onClick={() => setShowOrgSetup(true)}
              >
                {setupStatus?.hasOrganization ? 'Manage Organization' : 'Create Organization'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
                Upload an Excel file with your teams, stations, routing templates, and users.
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
                  Organize your workforce into teams that match how your facility operates.
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
                Add the work stations and equipment your teams will operate.
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

            {/* Step 4: First Work Order (auto-complete for ERP read-through orgs) */}
            <Card className={workOrdersStepDone ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {workOrdersStepDone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-muted-foreground" />
                    )}
                    {erpReadThrough ? 'Connect Work Orders' : 'Create First Work Order'}
                  </CardTitle>
                  {erpReadThrough ? (
                    <Badge variant="secondary">{erpVendor.toUpperCase()} managed</Badge>
                  ) : setupStatus?.hasWorkOrders && (
                    <Badge variant="secondary">{setupStatus.workOrdersCount} active</Badge>
                  )}
                </div>
                <CardDescription>
                  {erpReadThrough
                    ? `Your work orders live in ${erpVendor.toUpperCase()} and stream into JobLine in read-through mode.`
                    : 'Move your first job through the production line to see the Digital Expeditor in action.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant={workOrdersStepDone ? 'outline' : 'default'}
                  onClick={() => navigate(erpReadThrough ? '/queue' : '/work-orders')}
                  disabled={!setupStatus?.hasStations && !erpReadThrough}
                >
                  {erpReadThrough ? 'View ERP Queue' : (setupStatus?.hasWorkOrders ? 'Manage Work Orders' : 'Create First Work Order')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {!setupStatus?.hasStations && !erpReadThrough && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Add a station first to enable work order creation.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Continue Tour / Go to Dashboard */}
          <Card className={isSetupComplete 
            ? "bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30"
            : "bg-gradient-to-br from-primary/5 to-transparent border-primary/30"
          }>
            <CardContent className="pt-6 text-center">
              {isSetupComplete ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">Your Digital Expeditor is Ready!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your manufacturing floor is configured. Take a quick tour to learn how to move work orders through your production line.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        await completeStep('shop-setup');
                        await markWelcomeSeen();
                        navigate('/dashboard');
                      }}
                    >
                      Skip Tour
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={async () => {
                        await completeStep('shop-setup');
                        await markWelcomeSeen();
                        navigate('/dashboard');
                        setTimeout(() => startTour('dashboard-overview'), 500);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Take the Tour
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Ready to explore?</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up your data first, then take the tour to see how the Digital Expeditor helps you move jobs through production.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    💡 Tip: Complete the setup steps above to unlock the full guided tour.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      await completeStep('shop-setup');
                      await markWelcomeSeen();
                      navigate('/dashboard');
                    }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Preview Dashboard
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Don't show again */}
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground"
              onClick={async () => {
                await dismissSetupWizard();
                navigate('/dashboard');
              }}
            >
              Don't show this wizard again
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              You can always access Setup from Settings → Onboarding
            </p>
          </div>
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
