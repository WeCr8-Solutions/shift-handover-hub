import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmail } from '@/hooks/useEmail';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentTeam } from '@/contexts/TeamContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Send, Loader2 } from 'lucide-react';

interface InviteTeamMemberDialogProps {
  teamName?: string;
  onInviteSent?: () => void;
}

export function InviteTeamMemberDialog({ teamName, onInviteSent }: InviteTeamMemberDialogProps) {
  const { profile } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const { sendTeamInviteEmail } = useEmail();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSending, setIsSending] = useState(false);

  const team = teamName || currentTeam?.name || 'Your Team';
  const inviteUrl = `${window.location.origin}/auth?invite=true&team=${encodeURIComponent(team)}`;

  const handleSend = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter the team member\'s email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const result = await sendTeamInviteEmail(
      email,
      profile?.display_name || 'A team admin',
      team,
      inviteUrl,
      role
    );

    setIsSending(false);

    if (result.success) {
      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${email}.`,
      });
      setEmail('');
      setRole('member');
      setOpen(false);
      onInviteSent?.();
    } else {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-tour="create-team">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an email invitation to join <strong>{team}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'member' && 'Can view and submit handoffs'}
              {role === 'admin' && 'Can manage team members and stations'}
              {role === 'owner' && 'Full control over the team'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
