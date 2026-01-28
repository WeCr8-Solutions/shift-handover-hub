import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Loader2, AlertCircle, Ticket } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEmail } from "@/hooks/useEmail";
import { supabase } from "@/integrations/supabase/client";
import { InviteCodeRedemption } from "@/components/InviteCodeRedemption";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");
const displayNameSchema = z.string().min(2, "Display name must be at least 2 characters");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useEmail();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showInviteRedemption, setShowInviteRedemption] = useState(false);
  
  // Get invite code from URL if present
  const inviteCode = searchParams.get("invite") || "";
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      // If user just logged in with an invite code, show redemption
      if (inviteCode) {
        setShowInviteRedemption(true);
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate, inviteCode]);

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(loginEmail);
    } catch (e: any) {
      newErrors.loginEmail = e.errors[0].message;
    }
    
    try {
      passwordSchema.parse(loginPassword);
    } catch (e: any) {
      newErrors.loginPassword = e.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(signupEmail);
    } catch (e: any) {
      newErrors.signupEmail = e.errors[0].message;
    }
    
    try {
      passwordSchema.parse(signupPassword);
    } catch (e: any) {
      newErrors.signupPassword = e.errors[0].message;
    }
    
    try {
      displayNameSchema.parse(displayName);
    } catch (e: any) {
      newErrors.displayName = e.errors[0].message;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      newErrors.signupConfirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignup()) return;
    
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, displayName);
    setIsSubmitting(false);
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = "An account with this email already exists. Please log in instead.";
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      // Send welcome email
      sendWelcomeEmail(signupEmail, displayName);
      
      toast({
        title: "Account created!",
        description: "Welcome to JobLine.ai! Check your email for a welcome message.",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setResetSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show invite redemption for logged-in users with invite code
  if (showInviteRedemption && user) {
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

        <div className="w-full max-w-md">
          <InviteCodeRedemption
            initialCode={inviteCode}
            onSuccess={() => {
              toast({
                title: "Welcome!",
                description: "You've successfully joined the organization.",
              });
              navigate("/dashboard");
            }}
          />
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate("/dashboard")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
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
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {resetSent 
                ? "Check your email for reset instructions" 
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setForgotPasswordEmail('');
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
          <Factory className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            JobLine<span className="text-primary">.ai</span>
          </h1>
          <p className="text-xs text-muted-foreground">Manufacturing Handoff System</p>
        </div>
      </div>

      {/* Invite Code Banner */}
      {inviteCode && (
        <div className="w-full max-w-md mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Ticket className="w-4 h-4 text-primary" />
            <span>You have an invite code: <strong>{inviteCode}</strong></span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sign up or log in to join the organization
          </p>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {inviteCode 
              ? "Sign in or create an account to redeem your invite" 
              : "Sign in to your account or create a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="operator@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.loginEmail && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.loginEmail}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.loginPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.loginPassword}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="John Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.displayName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="operator@company.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.signupEmail && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupEmail}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.signupPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupPassword}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.signupConfirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.signupConfirmPassword}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <p className="mt-6 text-sm text-muted-foreground text-center">
        By signing up, you can use JobLine.ai individually or invite team members to collaborate.
      </p>
    </div>
  );
}