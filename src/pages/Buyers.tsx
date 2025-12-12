import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Buyers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
            <p className="text-muted-foreground">Manage your buyer database</p>
          </div>
          <Button asChild>
            <Link to="/buyers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Buyer
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Buyers Page</h3>
          <p className="text-muted-foreground mb-4">This is where you'll manage all your buyers.</p>
          <Button asChild>
            <Link to="/buyers/new">Add First Buyer</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
