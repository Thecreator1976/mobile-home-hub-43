import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List, Plus, Clock, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isToday, isTomorrow, startOfToday, isAfter } from "date-fns";

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "calendar";
  const { appointments, isLoading } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailDialogOpen(true);
  };

  // Stats
  const today = startOfToday();
  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;
  const todayCount = appointments.filter(a => isToday(parseISO(a.start_time)) && a.status === "scheduled").length;
  const upcomingCount = appointments.filter(a => isAfter(parseISO(a.start_time), today) && a.status === "scheduled").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Manage your appointments and schedule</p>
          </div>
          <Button asChild>
            <Link to="/calendar/new">
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                  <CalendarDays className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{todayCount}</div>
                  <p className="text-xs text-muted-foreground">appointments today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{upcomingCount}</div>
                  <p className="text-xs text-muted-foreground">scheduled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                  <p className="text-xs text-muted-foreground">this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">all time</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Calendar/List Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            {isLoading ? (
              <Card>
                <CardContent className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
                    <Skeleton className="h-4 w-48 mx-auto mb-2" />
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AppointmentCalendar
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
              />
            )}
          </TabsContent>

          <TabsContent value="list">
            {isLoading ? (
              <Card>
                <CardContent className="space-y-4 py-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <AppointmentList
                appointments={appointments}
                onEdit={handleAppointmentClick}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Appointment Detail Dialog */}
        <AppointmentDetailDialog
          appointment={selectedAppointment}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
}
