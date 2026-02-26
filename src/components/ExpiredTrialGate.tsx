import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Loader2 } from "lucide-react";

interface ExpiredTrialGateProps {
  children: ReactNode;
}

export function ExpiredTrialGate({ children }: ExpiredTrialGateProps) {
  const navigate = useNavigate();
  const { isTrialExpired, canBypassTrial, canManageBilling, loading } = useTrialStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Platform admins/devs bypass the gate
  if (canBypassTrial) {
    return <>{children}</>;
  }

  // Trial is not expired — allow access
  if (!isTrialExpired) {
    return <>{children}</>;
  }

  // Trial expired, no active subscription — show paywall
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full border-destructive/30 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Free Trial Ended</CardTitle>
          <CardDescription className="text-base mt-2">
            Your 14-day free trial has ended. Subscribe to continue using JobLine and keep your team running smoothly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {canManageBilling ? (
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/pricing")}
            >
              <CreditCard className="w-5 h-5" />
              Choose a Plan
            </Button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Contact your organization admin to upgrade your subscription.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
