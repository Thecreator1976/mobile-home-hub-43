import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  homeType: "single" | "double" | "triple";
  status: "new" | "contacted" | "offer" | "contract" | "closed" | "lost";
  askingPrice: number;
  targetOffer: number;
  createdAt: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "(555) 123-4567",
    email: "john.smith@email.com",
    address: "123 Oak Lane, Mobile Home Park A, Phoenix AZ",
    homeType: "double",
    status: "new",
    askingPrice: 45000,
    targetOffer: 35000,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Mary Johnson",
    phone: "(555) 234-5678",
    email: "mary.j@email.com",
    address: "456 Pine St, Sunny Acres, Mesa AZ",
    homeType: "single",
    status: "contacted",
    askingPrice: 62000,
    targetOffer: 52000,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    name: "Robert Davis",
    phone: "(555) 345-6789",
    email: "rdavis@email.com",
    address: "789 Maple Dr, Green Valley, Tempe AZ",
    homeType: "triple",
    status: "offer",
    askingPrice: 38000,
    targetOffer: 30000,
    createdAt: "2024-01-12",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    phone: "(555) 456-7890",
    email: "swilson@email.com",
    address: "321 Cedar Blvd, Lakeside MHP, Scottsdale AZ",
    homeType: "double",
    status: "contract",
    askingPrice: 55000,
    targetOffer: 48000,
    createdAt: "2024-01-10",
  },
  {
    id: "5",
    name: "Michael Brown",
    phone: "(555) 567-8901",
    email: "mbrown@email.com",
    address: "654 Elm Way, Riverside Estates, Gilbert AZ",
    homeType: "single",
    status: "closed",
    askingPrice: 72000,
    targetOffer: 65000,
    createdAt: "2024-01-08",
  },
  {
    id: "6",
    name: "Jennifer Lee",
    phone: "(555) 678-9012",
    email: "jlee@email.com",
    address: "987 Birch Ave, Desert Palms, Chandler AZ",
    homeType: "double",
    status: "lost",
    askingPrice: 48000,
    targetOffer: 40000,
    createdAt: "2024-01-05",
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

const homeTypeLabels: Record<Lead["homeType"], string> = {
  single: "Single Wide",
  double: "Double Wide",
  triple: "Triple Wide",
};

export default function SellerLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Leads</h1>
            <p className="text-muted-foreground">Manage and track your mobile home seller leads</p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/seller-leads/new">
              <Plus className="h-4 w-4 mr-2" />
              Add New Lead
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="offer">Offer Made</SelectItem>
              <SelectItem value="contract">Under Contract</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Lead Info
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Property
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Asking
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Target
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-card-foreground">{lead.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-card-foreground">{lead.address}</p>
                      <Badge variant="outline" className="mt-1">
                        {homeTypeLabels[lead.homeType]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={lead.status}>{statusLabels[lead.status]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(lead.askingPrice)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      {formatCurrency(lead.targetOffer)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Log Call
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

          {/* Empty State */}
          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No leads found matching your criteria.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
