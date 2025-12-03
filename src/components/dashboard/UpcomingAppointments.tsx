import { Calendar, Clock, MapPin, Phone, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  type: "call" | "meeting" | "viewing" | "closing";
  time: string;
  date: string;
  location?: string;
  contact: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    title: "Property Viewing",
    type: "viewing",
    time: "10:00 AM",
    date: "Today",
    location: "123 Oak Lane, Mobile Home Park A",
    contact: "John Smith",
  },
  {
    id: "2",
    title: "Follow-up Call",
    type: "call",
    time: "2:30 PM",
    date: "Today",
    contact: "Mary Johnson",
  },
  {
    id: "3",
    title: "Contract Signing",
    type: "closing",
    time: "11:00 AM",
    date: "Tomorrow",
    location: "Office",
    contact: "Sarah Wilson",
  },
  {
    id: "4",
    title: "Virtual Meeting",
    type: "meeting",
    time: "3:00 PM",
    date: "Tomorrow",
    contact: "Robert Davis",
  },
];

const typeIcons = {
  call: Phone,
  meeting: Video,
  viewing: MapPin,
  closing: Calendar,
};

const typeColors = {
  call: "bg-status-contacted/10 text-status-contacted",
  meeting: "bg-status-new/10 text-status-new",
  viewing: "bg-status-offer/10 text-status-offer",
  closing: "bg-status-contract/10 text-status-contract",
};

export function UpcomingAppointments() {
  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
          <p className="text-sm text-muted-foreground">Your schedule for the week</p>
        </div>
        <Button variant="outline" size="sm">View Calendar</Button>
      </div>
      <div className="divide-y divide-border">
        {mockAppointments.map((apt) => {
          const Icon = typeIcons[apt.type];
          return (
            <div
              key={apt.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
            >
              <div className={cn("rounded-xl p-3", typeColors[apt.type])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground">{apt.title}</p>
                <p className="text-sm text-muted-foreground">{apt.contact}</p>
                {apt.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {apt.location}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1">{apt.date}</Badge>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {apt.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full">View All Appointments</Button>
      </div>
    </div>
  );
}
