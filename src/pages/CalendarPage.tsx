import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View and manage your appointments</p>
          </div>
          <Button asChild>
            <Link to="/calendar/new">
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Your upcoming appointments and meetings</CardDescription>
          </CardHeader>
          <CardContent className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Calendar View Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                We're working on an interactive calendar view for your appointments.
              </p>
              <Button asChild>
                <Link to="/calendar/new">Schedule New Appointment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
