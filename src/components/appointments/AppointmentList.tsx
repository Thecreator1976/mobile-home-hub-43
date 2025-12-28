import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MapPin, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, Search, Plus, Building, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import { Appointment, AppointmentType, useAppointments } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
}

const typeLabels: Record<AppointmentType, string> = {
  call: "Phone Call",
  meeting: "Meeting",
  property_viewing: "Property Viewing",
  closing: "Closing",
};

const typeColors: Record<AppointmentType, string> = {
  call: "bg-blue-100 text-blue-800",
  meeting: "bg-purple-100 text-purple-800",
  property_viewing: "bg-green-100 text-green-800",
  closing: "bg-orange-100 text-orange-800",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function AppointmentList({ appointments, onEdit }: AppointmentListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  
  const { updateAppointment, deleteAppointment } = useAppointments();

  const filteredAppointments = appointments.filter((apt) => {
    // Search filter
    if (search && !apt.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && apt.type !== typeFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && apt.status !== statusFilter) {
      return false;
    }
    
    // Time filter
    const aptDate = parseISO(apt.start_time);
    const today = startOfToday();
    if (timeFilter === "upcoming" && isBefore(aptDate, today)) {
      return false;
    }
    if (timeFilter === "past" && isAfter(aptDate, today)) {
      return false;
    }
    
    return true;
  });

  const handleMarkComplete = async (id: string) => {
    await updateAppointment.mutateAsync({ id, status: "completed" });
  };

  const handleMarkCancelled = async (id: string) => {
    await updateAppointment.mutateAsync({ id, status: "cancelled" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      await deleteAppointment.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button asChild>
            <Link to="/calendar/new">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 pt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appointment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{apt.title}</p>
                        {apt.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {apt.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {apt.seller_lead_id && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              Property
                            </Badge>
                          )}
                          {apt.buyer_id && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Buyer
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[apt.type]}>
                        {typeLabels[apt.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{format(parseISO(apt.start_time), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(apt.start_time), "h:mm a")}
                            {apt.end_time && ` - ${format(parseISO(apt.end_time), "h:mm a")}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {apt.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{apt.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[apt.status]}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {apt.status === "scheduled" && (
                            <>
                              <DropdownMenuItem onClick={() => handleMarkComplete(apt.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkCancelled(apt.id)}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onEdit?.(apt)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(apt.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
