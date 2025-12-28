import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Clock, MapPin, User, Building, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Appointment, AppointmentType, useAppointments } from "@/hooks/useAppointments";
import { Link } from "react-router-dom";

interface AppointmentDetailDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AppointmentDetailDialog({ appointment, open, onOpenChange }: AppointmentDetailDialogProps) {
  const { updateAppointment, deleteAppointment } = useAppointments();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const handleEdit = () => {
    if (!appointment) return;
    setEditTitle(appointment.title);
    setEditDescription(appointment.description || "");
    setEditLocation(appointment.location || "");
    setEditStatus(appointment.status);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!appointment) return;
    await updateAppointment.mutateAsync({
      id: appointment.id,
      title: editTitle,
      description: editDescription || null,
      location: editLocation || null,
      status: editStatus as "scheduled" | "completed" | "cancelled",
    });
    setIsEditing(false);
  };

  const handleMarkComplete = async () => {
    if (!appointment) return;
    await updateAppointment.mutateAsync({ id: appointment.id, status: "completed" });
    onOpenChange(false);
  };

  const handleMarkCancelled = async () => {
    if (!appointment) return;
    await updateAppointment.mutateAsync({ id: appointment.id, status: "cancelled" });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!appointment) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
      await deleteAppointment.mutateAsync(appointment.id);
      onOpenChange(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            ) : (
              appointment.title
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColors[appointment.type]}>
              {typeLabels[appointment.type]}
            </Badge>
            <Badge className={statusColors[appointment.status]}>
              {appointment.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{format(parseISO(appointment.start_time), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(appointment.start_time), "h:mm a")}
                {appointment.end_time && ` - ${format(parseISO(appointment.end_time), "h:mm a")}`}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            {isEditing ? (
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Location"
              />
            ) : (
              <p className="text-sm">{appointment.location || "No location specified"}</p>
            )}
          </div>

          {/* Links */}
          <div className="flex gap-3">
            {appointment.seller_lead_id && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/seller-leads/${appointment.seller_lead_id}`}>
                  <Building className="h-4 w-4 mr-2" />
                  View Property
                </Link>
              </Button>
            )}
            {appointment.buyer_id && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/buyers/${appointment.buyer_id}`}>
                  <User className="h-4 w-4 mr-2" />
                  View Buyer
                </Link>
              </Button>
            )}
          </div>

          {/* Description */}
          {(appointment.description || isEditing) && (
            <div className="space-y-2">
              <Label>Notes / Agenda</Label>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                  {appointment.description}
                </div>
              )}
            </div>
          )}

          {/* Status Edit */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateAppointment.isPending}>
                {updateAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {appointment.status === "scheduled" && (
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkComplete}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkCancelled}
                    className="text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
