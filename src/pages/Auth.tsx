import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, AlertCircle, Ticket, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEmail } from "@/hooks/useEmail";
import { supabase } from "@/integrations/supabase/client";
import { InviteCodeRedemption } from "@/components/InviteCodeRedemption";
import { ConversionEvents, trackEvent } from "@/lib/analytics";
import { getTrafficSource } from "@/lib/utm";
import { lovable } from "@/integrations/lovable/index";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");
const displayNameSchema = z.string().min(2, "Name must be at least 2 characters");

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useEmail();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInviteRedemption, setShowInviteRedemption] = useState(false);

  // Single unified form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const inviteCode = searchParams.get("invite") || "";

  useEffect(() => {
    trackEvent("auth_visit", { source: getTrafficSource() });
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    trackEvent("sso_click", { provider: "google", source: getTrafficSource() });
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({
        title: "Google sign-in failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const checkOnboardingAndRedirect = async () => {
      if (!user || loading) return;
      if (inviteCode) {
        setShowInviteRedemption(true);
        return;
      }
      const redirectTo = searchParams.get("redirect");
      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        navigate(redirectTo, { replace: true });
        return;
      }
      const { data: onboarding } = await supabase
        .from("user_onboarding")
        .select("is_complete, has_seen_welcome")
        .eq("user_id", user.id)
        .maybeSingle();
      navigate(onboarding?.is_complete ? "/dashboard" : "/setup", { replace: true });
    };
    checkOnboardingAndRedirect();
  }, [user, loading, navigate, inviteCode, searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (e: any) { newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e: any) { newErrors.password = e.errors[0].message; }
    if (createMode) {
      try { displayNameSchema.parse(displayName); } catch (e: any) { newErrors.displayName = e.errors[0].message; }
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    if (createMode) {
      ConversionEvents.signupStart(window.location.pathname, "email");
      const { error } = await signUp(email, password, displayName);
      setIsSubmitting(false);
      if (error) {
        const msg = error.message.includes("already registered")
          ? "An account with this email already exists. Switch to sign in."
          : error.message;
        toast({ title: "Sign up failed", description: msg, variant: "destructive" });
      } else {
        ConversionEvents.signupComplete(window.location.pathname, "email");
        sendWelcomeEmail(email, displayName);
        toast({ title: "Account created!", description: "Check your email to verify, then sign in." });
        setCreateMode(false);
        setPassword("");
        setConfirmPassword("");
        setDisplayName("");
      }
      return;
    }

    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      const isInvalid = error.message === "Invalid login credentials";
      toast({
        title: "Login failed",
        description: isInvalid
          ? "Invalid email or password. New here? Tap 'Create an account' below."
          : error.message,
        variant: "destructive",
      });
    } else {
      ConversionEvents.login(window.location.pathname, "email");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
      toast({ title: "Reset email sent", description: "Check your inbox for instructions." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 px-6">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (showInviteRedemption && user) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
        <Logo />
        <div className="w-full max-w-md mt-6">
          <InviteCodeRedemption
            initialCode={inviteCode}
            onSuccess={() => {
              toast({ title: "Welcome!", description: "You've successfully joined the organization." });
              navigate("/dashboard");
            }}
          />
          <Button variant="ghost" className="w-full mt-4" onClick={() => navigate("/dashboard")}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-start sm:justify-center p-4 pt-6 sm:pt-4">
        <Logo />
        <Card className="w-full max-w-md mt-4">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {resetSent ? "Check your email for reset instructions" : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a reset link to <strong>{forgotPasswordEmail}</strong>
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setForgotPasswordEmail("");
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="operator@company.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start sm:justify-center p-4 pt-4 sm:pt-4">
      <Logo />

      {inviteCode && (
        <div className="w-full max-w-md mt-3 p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Ticket className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Invite code: <strong>{inviteCode}</strong></span>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md mt-3 sm:mt-4">
        <CardHeader className="text-center p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {inviteCode ? "Sign in to redeem your invite" : "Sign in or create an account in seconds"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          {/* SSO at top — single button works for both sign-in and sign-up */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GoogleIcon className="w-4 h-4 mr-2" />
            )}
            Continue with Google
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="operator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">Password</Label>
                {!createMode && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-xs"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot?
                  </Button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                autoComplete={createMode ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.password}
                </p>
              )}
            </div>

            <Collapsible open={createMode}>
              <CollapsibleContent className="space-y-3 data-[state=open]:pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-sm">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.displayName && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.displayName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Hidden duplicates so e2e helpers targeting #login-email / #login-password keep working */}
            <input type="hidden" id="login-email" value={email} readOnly />
            <input type="hidden" id="login-password" value={password} readOnly />

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{createMode ? "Creating account..." : "Signing in..."}</>
              ) : (
                createMode ? "Create Account" : "Sign In"
              )}
            </Button>

            <Collapsible open={createMode} onOpenChange={setCreateMode}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                  {createMode ? "Already have an account? Sign in" : "New here? Create an account"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${createMode ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-primary/10 border border-primary/20">
        <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          JobLine<span className="text-primary">.ai</span>
        </h1>
        <p className="hidden sm:block text-xs text-muted-foreground">Manufacturing Handoff System</p>
      </div>
    </div>
  );
}
