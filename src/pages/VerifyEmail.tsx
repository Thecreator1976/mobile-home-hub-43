import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const { user, signOut, isLoading } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Check if email is already verified
    if (user?.email_confirmed_at) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setResent(true);
      toast({
        title: "Email sent",
        description: "Verification email has been resent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    
    if (refreshedUser?.email_confirmed_at) {
      toast({
        title: "Email verified",
        description: "Your email has been verified.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Not verified yet",
        description: "Please check your email and click the verification link.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to
          </CardDescription>
          <p className="text-center font-medium text-primary">{user.email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the verification link to activate your account.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>After verifying your email:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your administrator will review your account</li>
              <li>You'll receive access to the CRM</li>
              <li>This usually takes 1-2 business days</li>
            </ul>
          </div>

          {resent && (
            <Alert className="bg-status-closed/10 border-status-closed/20">
              <CheckCircle className="h-4 w-4 text-status-closed" />
              <AlertDescription className="text-status-closed">
                Verification email resent! Check your inbox.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleCheckVerification}
            variant="gradient"
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            I've Verified My Email
          </Button>

          <Button
            onClick={handleResendVerification}
            variant="outline"
            className="w-full"
            disabled={resending}
          >
            {resending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
