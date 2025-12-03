import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "offer_made" | "under_contract" | "closed" | "lost";
type BuyerStatus = "active" | "inactive" | "closed";
type AppointmentStatus = "scheduled" | "completed" | "cancelled";

interface StatusBadgeProps {
  status: LeadStatus | BuyerStatus | AppointmentStatus | string;
  type?: "lead" | "buyer" | "appointment";
  className?: string;
}

const leadStatusConfig: Record<LeadStatus, { label: string; variant: "new" | "contacted" | "offer" | "contract" | "closed" | "lost" }> = {
  new: { label: "New", variant: "new" },
  contacted: { label: "Contacted", variant: "contacted" },
  offer_made: { label: "Offer Made", variant: "offer" },
  under_contract: { label: "Under Contract", variant: "contract" },
  closed: { label: "Closed", variant: "closed" },
  lost: { label: "Lost", variant: "lost" },
};

const buyerStatusConfig: Record<BuyerStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-status-closed/10 text-status-closed" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  closed: { label: "Closed", className: "bg-status-contract/10 text-status-contract" },
};

const appointmentStatusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-status-new/10 text-status-new" },
  completed: { label: "Completed", className: "bg-status-closed/10 text-status-closed" },
  cancelled: { label: "Cancelled", className: "bg-status-lost/10 text-status-lost" },
};

export function StatusBadge({ status, type = "lead", className }: StatusBadgeProps) {
  if (type === "lead") {
    const config = leadStatusConfig[status as LeadStatus];
    if (!config) {
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant={config.variant} className={className}>
        {config.label}
      </Badge>
    );
  }

  if (type === "buyer") {
    const config = buyerStatusConfig[status as BuyerStatus];
    if (!config) {
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
    }
    return (
      <span className={cn("status-badge", config.className, className)}>
        {config.label}
      </span>
    );
  }

  if (type === "appointment") {
    const config = appointmentStatusConfig[status as AppointmentStatus];
    if (!config) {
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
    }
    return (
      <span className={cn("status-badge", config.className, className)}>
        {config.label}
      </span>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}

// Utility to get status color for charts/visualizations
export function getStatusColor(status: LeadStatus): string {
  const colorMap: Record<LeadStatus, string> = {
    new: "hsl(var(--status-new))",
    contacted: "hsl(var(--status-contacted))",
    offer_made: "hsl(var(--status-offer))",
    under_contract: "hsl(var(--status-contract))",
    closed: "hsl(var(--status-closed))",
    lost: "hsl(var(--status-lost))",
  };
  return colorMap[status] || "hsl(var(--muted))";
}
