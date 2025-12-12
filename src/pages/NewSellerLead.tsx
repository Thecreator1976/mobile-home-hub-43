import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NewSellerLead() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/seller-leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Seller Lead</h1>
            <p className="text-muted-foreground">Add a new lead to your pipeline</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>Enter the details for the new lead</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-8 text-center text-muted-foreground">
                <p>Lead creation form will appear here.</p>
                <p className="text-sm mt-2">For now, this is a placeholder page.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" asChild>
                  <Link to="/seller-leads">Cancel</Link>
                </Button>
                <Button>Create Lead</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
