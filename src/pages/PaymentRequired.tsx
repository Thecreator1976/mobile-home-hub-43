import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, CreditCard, Check, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PaymentRequired() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  // Check if payment status changed
  const checkPaymentStatus = async () => {
    if (!user) return;
    
    setChecking(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("is_paid, status")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      if (data.is_paid) {
        toast({
          title: "Access Granted!",
          description: "Your subscription is now active.",
        });
        navigate("/dashboard", { replace: true });
      } else {
        toast({
          title: "Subscription Required",
          description: "Your account still requires an active subscription.",
          variant: "destructive",
        });
      }
    }
    setChecking(false);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('payment-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { is_paid: boolean };
          if (newData.is_paid) {
            toast({
              title: "Access Granted!",
              description: "Your subscription is now active.",
            });
            navigate("/dashboard", { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MobileHome CRM</h1>
            <p className="text-sm text-muted-foreground">Real Estate Management</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Subscription Required</CardTitle>
            <CardDescription>
              Your account has been approved! To access the CRM, please subscribe to one of our plans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Card */}
            <div className="border border-primary rounded-lg p-4 bg-primary/5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">Pro Plan</h3>
                  <p className="text-sm text-muted-foreground">Full access to all features</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">$49</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited seller leads
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Buyer management & matching
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Contract generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Financial tracking & reports
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Contact your administrator to activate your subscription, or check back after completing payment.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              variant="gradient" 
              className="w-full" 
              onClick={checkPaymentStatus}
              disabled={checking}
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Subscription Status
                </>
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSignOut}>
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
