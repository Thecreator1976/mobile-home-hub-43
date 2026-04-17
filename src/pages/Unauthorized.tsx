import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-destructive/10 rounded-full p-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-3">
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
          <div>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Or switch accounts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
