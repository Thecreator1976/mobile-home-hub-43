import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { useAppointments, Appointment } from "@/hooks/useAppointments";

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  call: { bg: "bg-yellow-100", border: "border-l-yellow-500", text: "text-yellow-800" },
  meeting: { bg: "bg-purple-100", border: "border-l-purple-500", text: "text-purple-800" },
  property_viewing: { bg: "bg-blue-100", border: "border-l-blue-500", text: "text-blue-800" },
  closing: { bg: "bg-green-100", border: "border-l-green-500", text: "text-green-800" },
};

const formatType = (type: string) => {
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { appointments, isLoading } = useAppointments();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day: Date): Appointment[] => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, day);
    });
  };

  const selectedDayAppointments = getAppointmentsForDay(selectedDate);
  const monthAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.start_time);
    return isSameMonth(aptDate, currentDate);
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View and manage all appointments</p>
          </div>
          <Button asChild>
            <Link to="/calendar/new">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        </div>

        {/* Calendar Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {monthAppointments.length} appointment{monthAppointments.length !== 1 ? "s" : ""} this month
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-border">
                    {/* Day Headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="bg-muted p-3 text-center text-sm font-semibold">
                        {day}
                      </div>
                    ))}

                    {/* Calendar Days */}
                    {calendarDays.map((day) => {
                      const dayAppointments = getAppointmentsForDay(day);
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSelected = isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`min-h-[100px] p-2 text-left transition-colors bg-background hover:bg-muted/50 ${
                            !isCurrentMonth ? "opacity-40" : ""
                          } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={`text-sm font-medium ${
                                isToday
                                  ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                  : ""
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            {isToday && (
                              <span className="text-xs text-primary font-medium">Today</span>
                            )}
                          </div>

                          <div className="mt-1 space-y-1">
                            {dayAppointments.slice(0, 2).map((apt) => {
                              const colors = typeColors[apt.type] || typeColors.call;
                              return (
                                <div
                                  key={apt.id}
                                  className={`text-xs px-1.5 py-0.5 rounded truncate border-l-2 ${colors.bg} ${colors.border} ${colors.text}`}
                                >
                                  {apt.title}
                                </div>
                              );
                            })}
                            {dayAppointments.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{dayAppointments.length - 2} more
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Day Detail */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/calendar/new?date=${format(selectedDate, "yyyy-MM-dd")}`}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDayAppointments.map((apt) => {
                      const colors = typeColors[apt.type] || typeColors.call;
                      return (
                        <div
                          key={apt.id}
                          className={`p-4 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{apt.title}</h4>
                            <Badge variant="outline" className="capitalize">
                              {formatType(apt.type)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(apt.start_time), "h:mm a")}
                              {apt.end_time && ` - ${format(parseISO(apt.end_time), "h:mm a")}`}
                            </p>
                            {apt.location && (
                              <p className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {apt.location}
                              </p>
                            )}
                            {apt.description && (
                              <p className="mt-2 text-foreground">{apt.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(typeColors).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded border-l-2 ${colors.bg} ${colors.border}`} />
                      <span className="text-sm capitalize">{formatType(type)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
