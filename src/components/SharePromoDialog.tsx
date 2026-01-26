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
import { useEmail } from '@/hooks/useEmail';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Gift, Send, Loader2, Copy, Check } from 'lucide-react';

interface SharePromoDialogProps {
  promoCode?: string;
  discountAmount?: string;
  expiryDate?: string;
}

export function SharePromoDialog({
  promoCode = 'JOBLINE25',
  discountAmount = '25%',
  expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
}: SharePromoDialogProps) {
  const { profile } = useAuth();
  const { sendPromoCodeEmail } = useEmail();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter the recipient\'s email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    const result = await sendPromoCodeEmail(
      recipientEmail,
      recipientName || 'Friend',
      profile?.display_name || 'A friend',
      promoCode,
      discountAmount,
      expiryDate
    );

    setIsSending(false);

    if (result.success) {
      toast({
        title: 'Promo code sent!',
        description: `${recipientName || 'Your friend'} will receive the promo code shortly.`,
      });
      setRecipientEmail('');
      setRecipientName('');
      setOpen(false);
    } else {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending the promo code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Promo code copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Gift className="w-4 h-4" />
          Share Promo Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Share a Special Offer
          </DialogTitle>
          <DialogDescription>
            Share your promo code with friends and earn rewards when they sign up!
          </DialogDescription>
        </DialogHeader>

        {/* Promo Code Display */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Promo Code</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-2xl font-bold tracking-widest">{promoCode}</code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {discountAmount} off · Expires {expiryDate}
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Recipient Name (optional)</Label>
            <Input
              id="recipient-name"
              placeholder="Their name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="friend@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
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
                Send Promo Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
