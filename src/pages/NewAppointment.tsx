import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Clock, Loader2, MapPin, Building, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppointments, AppointmentType, CreateAppointmentInput } from "@/hooks/useAppointments";
import { useSellerLeads } from "@/hooks/useSellerLeads";
import { useBuyers } from "@/hooks/useBuyers";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const appointmentTypes: { value: AppointmentType; label: string }[] = [
  { value: "call", label: "Phone Call" },
  { value: "meeting", label: "Meeting" },
  { value: "property_viewing", label: "Property Viewing" },
  { value: "closing", label: "Closing" },
];

export default function NewAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const leadId = searchParams.get("leadId");
  const buyerId = searchParams.get("buyerId");
  
  const { createAppointment } = useAppointments();
  const { leads } = useSellerLeads();
  const { buyers } = useBuyers();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AppointmentType>("meeting");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || "");
  const [selectedBuyerId, setSelectedBuyerId] = useState(buyerId || "");

  // Auto-fill location when property is selected
  const handleLeadSelect = (id: string) => {
    setSelectedLeadId(id);
    if (id && id !== "none") {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        setLocation(`${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""} ${lead.zip || ""}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) return;

    const startDateTime = new Date(date);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const input: CreateAppointmentInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: location.trim() || undefined,
      seller_lead_id: selectedLeadId && selectedLeadId !== "none" ? selectedLeadId : undefined,
      buyer_id: selectedBuyerId && selectedBuyerId !== "none" ? selectedBuyerId : undefined,
    };

    try {
      await createAppointment.mutateAsync(input);
      navigate("/calendar");
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/calendar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Appointment</h1>
            <p className="text-muted-foreground">Schedule a new meeting, call, or viewing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
              <CardDescription>Fill in the information for your new appointment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Property Viewing with John Smith"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter address or meeting location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Property/Lead Selection */}
              <div className="space-y-2">
                <Label>Link to Property (Seller Lead)</Label>
                <Select value={selectedLeadId} onValueChange={handleLeadSelect}>
                  <SelectTrigger>
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a property..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No property linked</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex flex-col">
                          <span>{lead.address}</span>
                          <span className="text-xs text-muted-foreground">
                            {lead.name} • {lead.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecting a property will auto-fill the location
                </p>
              </div>

              {/* Buyer Selection */}
              <div className="space-y-2">
                <Label>Link to Buyer</Label>
                <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                  <SelectTrigger>
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a buyer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No buyer linked</SelectItem>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        <div className="flex flex-col">
                          <span>{buyer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {buyer.email || buyer.phone || "No contact info"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Notes / Agenda</Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes or agenda items for this appointment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" type="button" asChild>
                  <Link to="/calendar">Cancel</Link>
                </Button>
                <Button type="submit" disabled={createAppointment.isPending || !title.trim()}>
                  {createAppointment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Appointment"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
