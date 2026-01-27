import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Plus, 
  Users, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Factory
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

      toast({
        title: 'Organization Created',
        description: `${orgName} is ready. Now let's set up your shop floor.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!user || !inviteCode.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Implement invite code lookup
      // For now, show a message that this feature is coming
      toast({
        title: 'Coming Soon',
        description: 'Organization invites will be available soon. For now, please create a new organization.',
      });
    } catch (error: any) {
      console.error('Error joining organization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join organization',
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
                <span className="text-sm">Invite team members with role-based access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Manage multiple teams and departments</span>
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
              <Users className="w-5 h-5" />
              Join an Organization
            </CardTitle>
            <CardDescription>
              Enter the invite code shared by your administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code *</Label>
              <Input
                id="invite-code"
                placeholder="Enter invite code..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={isLoading}
              />
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
                onClick={handleJoinOrganization}
                disabled={isLoading || !inviteCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Organization
                    <ArrowRight className="w-4 h-4 ml-2" />
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
