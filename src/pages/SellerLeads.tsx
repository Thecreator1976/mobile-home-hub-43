import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useSellerLeads, type LeadStatus, type HomeType } from "@/hooks/useSellerLeads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  offer_made: "Offer Made",
  under_contract: "Under Contract",
  closed: "Closed",
  lost: "Lost",
};

const statusBadgeVariant: Record<LeadStatus, "new" | "contacted" | "offer" | "contract" | "closed" | "lost"> = {
  new: "new",
  contacted: "contacted",
  offer_made: "offer",
  under_contract: "contract",
  closed: "closed",
  lost: "lost",
};

const homeTypeLabels: Record<HomeType, string> = {
  single: "Single Wide",
  double: "Double Wide",
  triple: "Triple Wide",
};

export default function SellerLeads() {
  const { leads, isLoading, deleteLead } = useSellerLeads();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [homeTypeFilter, setHomeTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesHomeType = homeTypeFilter === "all" || lead.home_type === homeTypeFilter;
    return matchesSearch && matchesStatus && matchesHomeType;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const handleDeleteClick = (id: string) => {
    setLeadToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      deleteLead.mutate(leadToDelete);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setHomeTypeFilter("all");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Leads</h1>
            <p className="text-muted-foreground">
              Manage all seller leads and track your sales pipeline
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/seller-leads/new">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="offer_made">Offer Made</SelectItem>
                  <SelectItem value="under_contract">Under Contract</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              <Select value={homeTypeFilter} onValueChange={setHomeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by home type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Home Types</SelectItem>
                  <SelectItem value="single">Single Wide</SelectItem>
                  <SelectItem value="double">Double Wide</SelectItem>
                  <SelectItem value="triple">Triple Wide</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Seller Leads</CardTitle>
            <CardDescription>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Property Details</TableHead>
                    <TableHead>Financials</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {leads.length === 0 
                          ? "No leads found. Create your first seller lead to get started."
                          : "No leads match your filters."}
                        {(searchQuery || statusFilter !== "all" || homeTypeFilter !== "all") && (
                          <Button variant="link" onClick={clearFilters} className="block mx-auto mt-2">
                            Clear filters
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{lead.name}</div>
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center text-sm text-muted-foreground hover:text-primary"
                              >
                                <Phone className="mr-1 h-3 w-3" />
                                {lead.phone}
                              </a>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="flex items-center text-sm text-muted-foreground hover:text-primary"
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                {lead.email}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{lead.address}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {homeTypeLabels[lead.home_type]}
                              {lead.year_built && ` • Built ${lead.year_built}`}
                              {lead.condition && ` • Condition: ${lead.condition}/5`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              Asking: <span className="font-medium">{formatCurrency(lead.asking_price)}</span>
                            </div>
                            {lead.target_offer && (
                              <div className="text-sm">
                                Target: <span className="font-medium text-primary">{formatCurrency(lead.target_offer)}</span>
                              </div>
                            )}
                            {lead.estimated_value && (
                              <div className="text-sm text-muted-foreground">
                                Est. Value: {formatCurrency(lead.estimated_value)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[lead.status]}>
                            {statusLabels[lead.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(lead.updated_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to={`/seller-leads/${lead.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/seller-leads/${lead.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Lead
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/seller-leads/${lead.id}/make-offer`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Make Offer
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to={`/calendar?leadId=${lead.id}`}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(lead.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Lead
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
