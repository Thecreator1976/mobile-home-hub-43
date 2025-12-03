import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from "lucide-react";
import { useState } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  type: "call" | "meeting" | "viewing" | "closing";
  time: string;
  contact: string;
  location?: string;
}

const mockEvents: Record<string, CalendarEvent[]> = {
  "2024-01-15": [
    { id: "1", title: "Property Viewing", type: "viewing", time: "10:00 AM", contact: "John Smith", location: "123 Oak Lane" },
    { id: "2", title: "Follow-up Call", type: "call", time: "2:30 PM", contact: "Mary Johnson" },
  ],
  "2024-01-16": [
    { id: "3", title: "Contract Signing", type: "closing", time: "11:00 AM", contact: "Sarah Wilson", location: "Office" },
  ],
  "2024-01-18": [
    { id: "4", title: "Virtual Meeting", type: "meeting", time: "3:00 PM", contact: "Robert Davis" },
    { id: "5", title: "Property Inspection", type: "viewing", time: "9:00 AM", contact: "Jennifer Lee", location: "456 Pine St" },
  ],
};

const typeColors: Record<string, string> = {
  call: "bg-status-contacted/20 border-status-contacted text-status-contacted",
  meeting: "bg-status-new/20 border-status-new text-status-new",
  viewing: "bg-status-offer/20 border-status-offer text-status-offer",
  closing: "bg-status-contract/20 border-status-contract text-status-contract",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDateKey = (day: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${currentDate.getFullYear()}-${month}-${dayStr}`;
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDateKey = getDateKey(currentDate.getDate());
  const selectedEvents = mockEvents[selectedDateKey] || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Schedule and manage your appointments</p>
          </div>
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-24" />;
                    }
                    const dateKey = getDateKey(day);
                    const events = mockEvents[dateKey] || [];
                    const isToday = day === 15; // Mock today
                    const isSelected = day === currentDate.getDate();

                    return (
                      <button
                        key={day}
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={`h-24 p-2 rounded-lg text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? "bg-primary/10 ring-2 ring-primary" : ""
                        } ${isToday ? "bg-muted" : ""}`}
                      >
                        <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                        <div className="mt-1 space-y-1">
                          {events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate border ${typeColors[event.type]}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{events.length - 2} more</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Day Detail */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {selectedEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border ${typeColors[event.type]}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge variant="outline" className="capitalize">{event.type}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </p>
                          <p className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {event.contact}
                          </p>
                          {event.location && (
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
