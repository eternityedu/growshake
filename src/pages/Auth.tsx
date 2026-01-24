import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, ArrowLeft, Loader2, Tractor, Leaf, Globe, KeyRound } from "lucide-react";
import logoMain from "@/assets/logo-main.png";

type AuthMode = "signin" | "signup" | "forgot-password" | "reset-password";
type UserRole = "user" | "farmer";

const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "EU", name: "European Union", currency: "EUR", symbol: "€" },
  { code: "IN", name: "India", currency: "INR", symbol: "₹" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$" },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "CN", name: "China", currency: "CNY", symbol: "¥" },
  { code: "BD", name: "Bangladesh", currency: "BDT", symbol: "৳" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦" },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$" },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "$" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup") return "signup";
    if (urlMode === "reset-password") return "reset-password";
    return "signin";
  });
  const [role, setRole] = useState<UserRole>(searchParams.get("role") === "farmer" ? "farmer" : "user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for password reset token in URL
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");
    
    if (type === "recovery" || accessToken) {
      setMode("reset-password");
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== "reset-password") {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset-password");
      } else if (session && mode !== "reset-password") {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error("Please enter your email address");
      }

      const redirectUrl = `${window.location.origin}/auth?mode=reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Reset link sent!",
        description: "Check your email for a password reset link.",
      });
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been reset successfully. You can now sign in.",
      });
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          throw new Error("Full name is required");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (!country) {
          throw new Error("Please select your country");
        }

        const selectedCountry = COUNTRIES.find(c => c.code === country);
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName.trim(),
              role: role,
              country: country,
              currency: selectedCountry?.currency || "USD",
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Account created!",
            description: role === "farmer" 
              ? "Your farmer account is pending admin approval. You can sign in now."
              : "Welcome to GrowShare! You can now sign in.",
          });
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      let message = error.message || "Something went wrong. Please try again.";
      if (message.includes("User already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We'll send you a link to reset your password
        </p>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
          />
        </div>
        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );

  const renderMainForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>I want to</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="user"
                  id="user"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="user"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:bg-primary/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                >
                  <Leaf className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Get Vegetables</span>
                  <span className="text-xs text-muted-foreground">As a user</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="farmer"
                  id="farmer"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="farmer"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:bg-primary/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                >
                  <Tractor className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Offer Land</span>
                  <span className="text-xs text-muted-foreground">As a farmer</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label>Country *</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Prices will be shown in your local currency
            </p>
          </div>
        </>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password *</Label>
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot-password")}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
          />
        </div>
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === "signin" ? "Signing in..." : "Creating account..."}
          </>
        ) : mode === "signin" ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Toggle Mode */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );

  const getTitle = () => {
    switch (mode) {
      case "forgot-password":
        return "Reset Password";
      case "reset-password":
        return "Set New Password";
      case "signup":
        return "Join GrowShare";
      default:
        return "Welcome Back";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "forgot-password":
        return "Enter your email to receive a reset link";
      case "reset-password":
        return "Create a new secure password";
      case "signup":
        return "Create an account to start growing";
      default:
        return "Sign in to access your account";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 leaf-pattern opacity-30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card className="shadow-soft border-primary/10">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="flex items-center justify-center gap-3 mb-4">
              <img src={logoMain} alt="GrowShare" className="h-14 w-14 rounded-xl" />
              <span className="font-display text-2xl font-bold">
                Grow<span className="text-primary">Share</span>
              </span>
            </Link>
            <CardTitle className="text-2xl font-display">
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {mode === "forgot-password" && renderForgotPasswordForm()}
            {mode === "reset-password" && renderResetPasswordForm()}
            {(mode === "signin" || mode === "signup") && renderMainForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;