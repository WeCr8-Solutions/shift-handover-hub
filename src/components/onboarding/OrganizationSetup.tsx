import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateInviteCode, redeemInviteCode } from '@/hooks/useOrganizationInvites';
import { getSafeErrorMessage } from '@/lib/errorHandling';
import { 
  Building2, 
  Plus, 
  Users, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Factory,
  XCircle,
  Ticket
} from 'lucide-react';

interface OrganizationSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OrganizationSetup({ onComplete, onSkip }: OrganizationSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create organization form
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  
  // Join organization form
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedInvite, setValidatedInvite] = useState<{
    id: string;
    organizationId: string;
    organizationName: string;
    teamId: string | null;
    teamName: string | null;
    orgRole: string;
    appRole: string | null;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateOrganization = async () => {
    if (!user || !orgName.trim()) return;

    setIsLoading(true);
    try {
      // Generate slug from name
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug,
          description: orgDescription.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Auto-create a default team so solo operators can start immediately
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: 'Shop Floor',
          description: 'Default production team',
          organization_id: org.id,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (!teamError && team) {
        // Add user as team owner
        await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
          });

        // Auto-create a general work station
        await supabase
          .from('stations')
          .insert({
            name: 'Station 1',
            station_id: 'STN-001',
            work_center: 'General',
            work_center_type: 'Manual Mill',
            team_id: team.id,
            organization_id: org.id,
            is_active: true,
          });
      }

      toast({
        title: 'Organization Created',
        description: `${orgName} is ready with a default team and station. You're all set!`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCode = async () => {
    if (!inviteCode.trim()) {
      setValidationError('Please enter an invite code');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidatedInvite(null);

    const result = await validateInviteCode(inviteCode);
    setIsValidating(false);

    if (result.valid && result.invite) {
      setValidatedInvite(result.invite);
    } else {
      setValidationError('Invalid or expired invite code');
    }
  };

  const formatInviteCode = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  };

  const handleJoinOrganization = async () => {
    if (!user || !validatedInvite) return;

    setIsLoading(true);
    try {
      const result = await redeemInviteCode(inviteCode, user.id);
      
      if (result.error) {
        toast({
          title: 'Failed to join',
          description: getSafeErrorMessage(result.error),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Welcome!',
        description: `You've joined ${validatedInvite.organizationName}`,
      });
      onComplete();
    } catch (error: any) {
      console.error('Error joining organization:', error);
      toast({
        title: 'Error',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Set Up Your Organization</h2>
        <p className="text-muted-foreground">
          Organizations keep your manufacturing data separate and secure from other companies.
        </p>
      </div>

      {/* Selection Cards */}
      {!mode && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setMode('create')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Create Organization</CardTitle>
              <CardDescription>
                Set up a new company workspace for your manufacturing floor
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" variant="outline">
                Create New
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setMode('join')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Join Organization</CardTitle>
              <CardDescription>
                Join an existing company with an invite code
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" variant="outline">
                Enter Code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Organization Form */}
      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5" />
              Create Your Organization
            </CardTitle>
            <CardDescription>
              This will be your company's workspace in JobLine.ai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                placeholder="e.g., Acme Manufacturing Co."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-description">Description (optional)</Label>
              <Textarea
                id="org-description"
                placeholder="Brief description of your manufacturing operations..."
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">All your data is isolated and secure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Auto-creates a default team, station &amp; membership</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Works for a solo operator or a full crew</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setMode(null)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCreateOrganization}
                disabled={isLoading || !orgName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join Organization Form */}
      {mode === 'join' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Join an Organization
            </CardTitle>
            <CardDescription>
              Enter the invite code shared by your administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-code"
                  placeholder="ABCD1234"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(formatInviteCode(e.target.value));
                    setValidatedInvite(null);
                    setValidationError(null);
                  }}
                  className="font-mono tracking-widest text-center text-lg"
                  maxLength={8}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleValidateCode}
                  disabled={isValidating || inviteCode.length < 4}
                  variant="outline"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="w-4 h-4" />
                {validationError}
              </div>
            )}

            {validatedInvite && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Valid invite code
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{validatedInvite.organizationName}</p>
                      <p className="text-sm text-muted-foreground">Organization</p>
                    </div>
                  </div>

                  {validatedInvite.teamName && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{validatedInvite.teamName}</p>
                        <p className="text-sm text-muted-foreground">Auto-join team</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setMode(null);
                  setValidatedInvite(null);
                  setValidationError(null);
                  setInviteCode('');
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                className="flex-1"
                onClick={handleJoinOrganization}
                disabled={isLoading || !validatedInvite}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Join {validatedInvite?.organizationName || 'Organization'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip Option */}
      {onSkip && !mode && (
        <div className="text-center">
          <Button variant="link" onClick={onSkip} className="text-muted-foreground">
            Skip for now
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            You can set up an organization later from settings
          </p>
        </div>
      )}
    </div>
  );
}
