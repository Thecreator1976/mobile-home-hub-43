import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function SellerLeads() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Leads</h1>
            <p className="text-muted-foreground">Manage your seller leads pipeline</p>
          </div>
          <Button asChild>
            <Link to="/seller-leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Seller Leads Page</h3>
          <p className="text-muted-foreground mb-4">This is where you'll see all your seller leads in a table.</p>
          <Button asChild>
            <Link to="/seller-leads/new">Create First Lead</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
