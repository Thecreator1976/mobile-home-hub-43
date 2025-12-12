import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, MessageSquare, CalendarPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useSellerLeads } from "@/hooks/useSellerLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

type LeadStatus = "new" | "contacted" | "offer_made" | "under_contract" | "closed" | "lost";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  offer_made: "Offer Made",
  under_contract: "Under Contract",
  closed: "Closed",
  lost: "Lost",
};

const statusVariants: Record<LeadStatus, "new" | "contacted" | "offer" | "contract" | "closed" | "lost"> = {
  new: "new",
  contacted: "contacted",
  offer_made: "offer",
  under_contract: "contract",
  closed: "closed",
  lost: "lost",
};

export function RecentLeadsTable() {
  const { leads, isLoading } = useSellerLeads();
  const navigate = useNavigate(); // Added for programmatic navigation

  const formatCurrency = (value: number | null | undefined) =>
    value
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
      : "-";

  // Get the 5 most recent leads
  const recentLeads = leads?.slice(0, 5) || [];

  const handleAddNote = (leadId: string, leadName: string) => {
    // Navigate to lead detail with note modal or implement modal logic
    navigate(`/seller-leads/${leadId}#notes`);
    // You could also open a modal here:
    // openNoteModal(leadId, leadName);
  };

  const handleScheduleAppointment = (leadId: string, leadName: string) => {
    // Navigate to calendar with pre-filled lead info
    navigate(`/calendar/new?leadId=${leadId}&title=Appointment with ${encodeURIComponent(leadName)}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-6 space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold">Recent Seller Leads</h3>
          <p className="text-sm text-muted-foreground">Your latest lead activity</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/seller-leads">View All</Link>
        </Button>
      </div>
      {recentLeads.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No leads yet. Add your first lead to get started!</p>
          <Button className="mt-4" asChild>
            <Link to="/seller-leads/new">Add Lead</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Lead
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Asking
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Target
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Added
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-card-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.address}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariants[lead.status as LeadStatus] || "default"}>
                      {statusLabels[lead.status as LeadStatus] || lead.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(lead.asking_price)}</td>
                  <td className="px-6 py-4 text-right font-medium text-primary">{formatCurrency(lead.target_offer)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/seller-leads/${lead.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/seller-leads/${lead.id}`} className="cursor-pointer flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAddNote(lead.id, lead.name)}
                            className="cursor-pointer flex items-center"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Add Note
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleScheduleAppointment(lead.id, lead.name)}
                            className="cursor-pointer flex items-center"
                          >
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Schedule Appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
