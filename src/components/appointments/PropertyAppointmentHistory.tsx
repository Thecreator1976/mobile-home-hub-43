import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, CheckCircle, XCircle, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, isPast } from "date-fns";
import { Appointment, AppointmentType } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface PropertyAppointmentHistoryProps {
  appointments: Appointment[];
  leadId: string;
  leadName?: string;
}

const typeLabels: Record<AppointmentType, string> = {
  call: "Call",
  meeting: "Meeting",
  property_viewing: "Viewing",
  closing: "Closing",
};

const typeColors: Record<AppointmentType, string> = {
  call: "bg-blue-500",
  meeting: "bg-purple-500",
  property_viewing: "bg-green-500",
  closing: "bg-orange-500",
};

export function PropertyAppointmentHistory({ appointments, leadId, leadName }: PropertyAppointmentHistoryProps) {
  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "scheduled" && !isPast(parseISO(apt.start_time)))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
  const pastAppointments = appointments
    .filter((apt) => apt.status !== "scheduled" || isPast(parseISO(apt.start_time)))
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Appointments
            </CardTitle>
            <CardDescription>
              {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link to={`/calendar/new?leadId=${leadId}&title=${encodeURIComponent(leadName || "Property")}`}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No appointments scheduled yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link to={`/calendar/new?leadId=${leadId}`}>
                Schedule your first appointment
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h4>
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <AppointmentItem key={apt.id} appointment={apt} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {pastAppointments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Past</h4>
                <div className="space-y-3">
                  {pastAppointments.slice(0, 5).map((apt) => (
                    <AppointmentItem key={apt.id} appointment={apt} />
                  ))}
                  {pastAppointments.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link to="/calendar">View all {pastAppointments.length} past appointments</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";
  const isPastDate = isPast(parseISO(appointment.start_time));

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        isCompleted && "bg-green-50/50 border-green-200",
        isCancelled && "bg-red-50/50 border-red-200 opacity-60",
        !isCompleted && !isCancelled && isPastDate && "opacity-60"
      )}
    >
      <div className={cn("w-1 h-full min-h-[40px] rounded-full", typeColors[appointment.type])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{appointment.title}</span>
          <Badge variant="outline" className="text-xs">
            {typeLabels[appointment.type]}
          </Badge>
          {isCompleted && (
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
          {isCancelled && (
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(appointment.start_time), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(parseISO(appointment.start_time), "h:mm a")}
          </span>
        </div>
        {appointment.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{appointment.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
