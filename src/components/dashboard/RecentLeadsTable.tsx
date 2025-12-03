import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface Lead {
  id: string;
  name: string;
  address: string;
  status: "new" | "contacted" | "offer" | "contract" | "closed" | "lost";
  askingPrice: number;
  targetOffer: number;
  lastContact: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    address: "123 Oak Lane, Mobile Home Park A",
    status: "new",
    askingPrice: 45000,
    targetOffer: 35000,
    lastContact: "2 hours ago",
  },
  {
    id: "2",
    name: "Mary Johnson",
    address: "456 Pine St, Sunny Acres",
    status: "contacted",
    askingPrice: 62000,
    targetOffer: 52000,
    lastContact: "1 day ago",
  },
  {
    id: "3",
    name: "Robert Davis",
    address: "789 Maple Dr, Green Valley",
    status: "offer",
    askingPrice: 38000,
    targetOffer: 30000,
    lastContact: "3 days ago",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    address: "321 Cedar Blvd, Lakeside MHP",
    status: "contract",
    askingPrice: 55000,
    targetOffer: 48000,
    lastContact: "1 week ago",
  },
  {
    id: "5",
    name: "Michael Brown",
    address: "654 Elm Way, Riverside Estates",
    status: "closed",
    askingPrice: 72000,
    targetOffer: 65000,
    lastContact: "2 weeks ago",
  },
];

const statusLabels: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  offer: "Offer Made",
  contract: "Under Contract",
  closed: "Closed",
  lost: "Lost",
};

export function RecentLeadsTable() {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

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
                Last Contact
              </th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-card-foreground">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.address}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={lead.status}>{statusLabels[lead.status]}</Badge>
                </td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(lead.askingPrice)}</td>
                <td className="px-6 py-4 text-right font-medium text-primary">{formatCurrency(lead.targetOffer)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.lastContact}</td>
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
                        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                        <DropdownMenuItem>Add Note</DropdownMenuItem>
                        <DropdownMenuItem>Schedule Appointment</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
