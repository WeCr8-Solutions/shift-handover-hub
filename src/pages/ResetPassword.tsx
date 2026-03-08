import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    // Listen for the SIGNED_IN or PASSWORD_RECOVERY event from the recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    // Also check if there's already a session (user may have already been authenticated via the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // If no session after a timeout, show error
    const timeout = setTimeout(() => {
      if (!sessionReady) {
        setSessionError(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [sessionReady]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = e.errors[0].message;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsComplete(true);
      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
          <Factory className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            JobLine<span className="text-primary">.ai</span>
          </h1>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{isComplete ? "Password Reset Complete" : "Set New Password"}</CardTitle>
          <CardDescription>
            {isComplete
              ? "You can now sign in with your new password"
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isComplete ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Your password has been successfully updated.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Go to Sign In
              </Button>
            </div>
          ) : sessionError && !sessionReady ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Back to Sign In
              </Button>
            </div>
          ) : !sessionReady ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
