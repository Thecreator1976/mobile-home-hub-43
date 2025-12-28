import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from "date-fns";
import { Appointment, AppointmentType } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

const typeColors: Record<AppointmentType, string> = {
  call: "bg-blue-500",
  meeting: "bg-purple-500",
  property_viewing: "bg-green-500",
  closing: "bg-orange-500",
};

const typeLabels: Record<AppointmentType, string> = {
  call: "Call",
  meeting: "Meeting",
  property_viewing: "Viewing",
  closing: "Closing",
};

export function AppointmentCalendar({ appointments, onAppointmentClick }: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, day);
    });
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button asChild size="sm">
              <Link to="/calendar/new">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Link>
            </Button>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 text-sm">
              <div className={cn("w-3 h-3 rounded-full", typeColors[type as AppointmentType])} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {calendarDays.map((day, idx) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] p-2 bg-background",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => onAppointmentClick?.(apt)}
                      className={cn(
                        "w-full text-left text-xs p-1 rounded truncate text-white",
                        typeColors[apt.type]
                      )}
                      title={apt.title}
                    >
                      {format(parseISO(apt.start_time), "HH:mm")} {apt.title}
                    </button>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
