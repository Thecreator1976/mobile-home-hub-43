import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function NewAppointment() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");
  const title = searchParams.get("title");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/calendar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Appointment</h1>
            <p className="text-muted-foreground">Schedule a new meeting or call</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>Fill in the details for your new appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadId && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Linked to Lead:</span> {title || "Lead #" + leadId}
                  </p>
                </div>
              )}

              <div className="p-8 text-center text-muted-foreground">
                <p>Appointment form coming soon...</p>
                <p className="text-sm mt-2">For now, use this as a placeholder for scheduling appointments.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" asChild>
                  <Link to="/calendar">Cancel</Link>
                </Button>
                <Button>Schedule Appointment</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
