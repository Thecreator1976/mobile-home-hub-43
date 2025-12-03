import { Calendar, Clock, MapPin, Phone, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const typeIcons = {
  call: Phone,
  meeting: Video,
  property_viewing: MapPin,
  closing: Calendar,
};

const typeColors = {
  call: "bg-status-contacted/10 text-status-contacted",
  meeting: "bg-status-new/10 text-status-new",
  property_viewing: "bg-status-offer/10 text-status-offer",
  closing: "bg-status-contract/10 text-status-contract",
};

export function UpcomingAppointments() {
  const { appointments, isLoading } = useAppointments();

  // Get upcoming appointments (today and future)
  const upcomingAppointments = appointments
    ?.filter((apt) => {
      const startTime = parseISO(apt.start_time);
      return startTime >= new Date();
    })
    .slice(0, 4) || [];

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-4 space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
          <p className="text-sm text-muted-foreground">Your schedule for the week</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/calendar">View Calendar</Link>
        </Button>
      </div>
      {upcomingAppointments.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming appointments</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/calendar">Schedule One</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {upcomingAppointments.map((apt) => {
              const Icon = typeIcons[apt.type as keyof typeof typeIcons] || Calendar;
              const colorClass = typeColors[apt.type as keyof typeof typeColors] || typeColors.meeting;
              
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={cn("rounded-xl p-3", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">{apt.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.description || "No description"}
                    </p>
                    {apt.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {apt.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {getDateLabel(apt.start_time)}
                    </Badge>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(apt.start_time), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/calendar">View All Appointments</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
