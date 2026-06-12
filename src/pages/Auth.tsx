import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, AlertCircle, Ticket, ChevronDown, Building2, User, ArrowLeft } from "lucide-react";
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
  // Tell Google not to index the auth page (Googlebot executes JS and honors meta-robots set this way).
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useEmail();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInviteRedemption, setShowInviteRedemption] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleResendVerification = async (targetEmail: string) => {
    setResendingVerification(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo: `${window.location.origin}/setup?verified=1` },
    });
    setResendingVerification(false);
    if (error) {
      toast({ title: "Could not resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification email sent", description: `Check ${targetEmail} for the link.` });
    }
  };

  // Single unified form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialMode = searchParams.get("mode") === "signup" || searchParams.get("signup") === "1";
  const [createMode, setCreateMode] = useState(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Signup intent: "org" (shop owner / supervisor) or "talent" (operator / machinist).
  // Persisted in sessionStorage so it survives the email-verification round-trip
  // and Google OAuth redirect.
  type SignupIntent = "org" | "talent";
  const readStoredIntent = (): SignupIntent | null => {
    if (typeof window === "undefined") return null;
    const v = window.sessionStorage.getItem("signup_intent");
    return v === "org" || v === "talent" ? v : null;
  };
  const urlIntent = (() => {
    const v = searchParams.get("intent");
    return v === "org" || v === "talent" ? (v as SignupIntent) : null;
  })();
  const [intent, setIntentState] = useState<SignupIntent | null>(urlIntent ?? readStoredIntent());

  const setIntent = (v: SignupIntent | null) => {
    setIntentState(v);
    if (typeof window === "undefined") return;
    if (v) window.sessionStorage.setItem("signup_intent", v);
    else window.sessionStorage.removeItem("signup_intent");
  };

  // If URL has ?intent=, persist immediately.
  useEffect(() => {
    if (urlIntent) setIntent(urlIntent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIntent]);

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
      // F-8: Allowlist for ?redirect= param (?next= accepted as an alias)
      const REDIRECT_ALLOWLIST = /^\/(dashboard|talent|oap|gcode-academy|gca|operator|settings|queue|teams|setup|verify|admin|employers|onboarding|onboarding-service)(\/.*)?$/;
      const redirectTo = searchParams.get("redirect") ?? searchParams.get("next");
      if (redirectTo && REDIRECT_ALLOWLIST.test(redirectTo)) {
        navigate(redirectTo, { replace: true });
        return;
      }
      // Intent-driven routing (set during signup CTA or intent picker).
      // Only override when the user has no org membership yet — returning users
      // with an org should always follow the server-authoritative resolver.
      const storedIntent = readStoredIntent();
      if (storedIntent) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (!membership) {
          setIntent(null);
          if (storedIntent === "talent") {
            navigate("/operator/profile?welcome=1", { replace: true });
          } else {
            navigate("/setup", { replace: true });
          }
          return;
        }
        // Has an org already — clear stale intent and fall through.
        setIntent(null);
      }
      // F-2/F-5: Server-authoritative routing
      const { data, error } = await supabase.rpc("resolve_post_login_destination");
      if (error) {
        console.error("resolve_post_login_destination failed:", error);
        navigate("/dashboard", { replace: true });
        return;
      }
      const destination = (data as { destination?: string } | null)?.destination ?? "/dashboard";
      navigate(destination, { replace: true });
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
      if (!intent) newErrors.intent = "Please choose how you'll use JobLine.ai above.";
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
        toast({
          title: "Account created!",
          description: "Check your email to verify, then sign in.",
        });
        // G4: Surface a persistent in-page Resend CTA in case the verification email lands in spam
        setUnverifiedEmail(email);
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
      const msg = (error.message || "").toLowerCase();
      const isUnverified = msg.includes("not confirmed") || msg.includes("email not confirmed") || msg.includes("not verified");
      const isInvalid = error.message === "Invalid login credentials";
      if (isUnverified) {
        setUnverifiedEmail(email);
        toast({
          title: "Email not verified",
          description: "Confirm your email to sign in. We can resend the link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: isInvalid
            ? "Invalid email or password. New here? Tap 'Create an account' below."
            : error.message,
          variant: "destructive",
        });
      }
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
          {unverifiedEmail && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-2">
              <p className="text-foreground">
                <strong>Verify your email</strong> — we sent a link to{" "}
                <span className="font-mono">{unverifiedEmail}</span>.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8"
                onClick={() => handleResendVerification(unverifiedEmail)}
                disabled={resendingVerification}
              >
                {resendingVerification ? (
                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Resending...</>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </div>
          )}

          {createMode && !intent && (
            <div className="space-y-2">
              <p className="text-sm font-medium">How will you use JobLine.ai?</p>
              <button
                type="button"
                onClick={() => setIntent("org")}
                className="w-full text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors p-3 flex items-start gap-3"
              >
                <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">I run or work at a shop</div>
                  <div className="text-xs text-muted-foreground">
                    Set up your organization, invite your team, track work orders &amp; handoffs.
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIntent("talent")}
                className="w-full text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors p-3 flex items-start gap-3"
              >
                <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">I'm a CNC operator / machinist</div>
                  <div className="text-xs text-muted-foreground">
                    Free forever. Build a public skills profile and get found by hiring shops.
                  </div>
                </div>
              </button>
              {errors.intent && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.intent}
                </p>
              )}
            </div>
          )}

          {createMode && intent && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="flex items-center gap-2">
                {intent === "org" ? <Building2 className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-primary" />}
                Signing up as <strong>{intent === "org" ? "Shop / Organization" : "Operator (free talent profile)"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIntent(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />Change
              </button>
            </div>
          )}

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
