import { useState } from "react";
import { validateInviteCode, redeemInviteCode } from "@/hooks/useOrganizationInvites";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Building2, Users, Ticket } from "lucide-react";

interface InviteCodeRedemptionProps {
  onSuccess?: (organizationId: string, teamId: string | null) => void;
  initialCode?: string;
}

export function InviteCodeRedemption({ onSuccess, initialCode = "" }: InviteCodeRedemptionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [code, setCode] = useState(initialCode);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
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

  const handleValidate = async () => {
    if (!code.trim()) {
      setValidationError("Please enter an invite code");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidatedInvite(null);

    const result = await validateInviteCode(code);

    setIsValidating(false);

    if (result.valid && result.invite) {
      setValidatedInvite(result.invite);
    } else {
      setValidationError("Invalid or expired invite code");
    }
  };

  const handleRedeem = async () => {
    if (!user || !validatedInvite) return;

    setIsRedeeming(true);
    const result = await redeemInviteCode(code, user.id);
    setIsRedeeming(false);

    if (result.error) {
      toast({
        title: "Failed to join",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: `You've joined ${validatedInvite.organizationName}`,
      });
      onSuccess?.(result.organizationId!, result.teamId || null);
    }
  };

  const formatCode = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Join with Invite Code
        </CardTitle>
        <CardDescription>
          Enter an invite code to join an organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-code">Invite Code</Label>
          <div className="flex gap-2">
            <Input
              id="invite-code"
              placeholder="ABCD1234"
              value={code}
              onChange={(e) => {
                setCode(formatCode(e.target.value));
                setValidatedInvite(null);
                setValidationError(null);
              }}
              className="font-mono tracking-widest text-center text-lg"
              maxLength={8}
            />
            <Button
              onClick={handleValidate}
              disabled={isValidating || code.length < 4}
              variant="outline"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
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
              <CheckCircle className="w-4 h-4" />
              Valid invite code
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
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

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">
                  Org Role: {validatedInvite.orgRole}
                </Badge>
                {validatedInvite.appRole && (
                  <Badge variant="secondary">
                    App Role: {validatedInvite.appRole}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={handleRedeem}
              disabled={isRedeeming}
              className="w-full"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Join {validatedInvite.organizationName}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
