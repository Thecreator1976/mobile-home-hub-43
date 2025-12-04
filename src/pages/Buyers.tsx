import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Upload,
  Phone,
  Mail,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { useBuyers, Buyer } from "@/hooks/useBuyers";

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
  closed: { label: "Closed", color: "bg-blue-100 text-blue-800" },
};

const formatCurrency = (value: number | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

export default function Buyers() {
  const { buyers, isLoading, deleteBuyer } = useBuyers();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Get unique locations
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    buyers.forEach((buyer) => {
      buyer.locations?.forEach((location) => {
        if (location.trim()) locations.add(location);
      });
    });
    return Array.from(locations).sort();
  }, [buyers]);

  // Filter buyers
  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchesSearch =
        !searchTerm ||
        buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.phone?.includes(searchTerm) ||
        buyer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || buyer.status === statusFilter;

      const matchesLocation =
        locationFilter === "all" ||
        buyer.locations?.some((loc) => loc.toLowerCase().includes(locationFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [buyers, searchTerm, statusFilter, locationFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBuyer.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLocationFilter("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
            <p className="text-muted-foreground">
              Manage potential buyers and match them with available properties
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/buyers/import">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link to="/buyers/new">
                <Plus className="h-4 w-4 mr-2" />
                New Buyer
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search buyers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buyers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Buyers</CardTitle>
            <CardDescription>
              {filteredBuyers.length} buyer{filteredBuyers.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Criteria</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuyers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No buyers found. Import CSV or create a new buyer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBuyers.map((buyer) => (
                        <TableRow key={buyer.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{buyer.name}</div>
                              {buyer.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {buyer.phone}
                                </div>
                              )}
                              {buyer.email && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="mr-1 h-3 w-3" />
                                  {buyer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Types:</span>{" "}
                                {buyer.home_types?.map((t) => `${t} wide`).join(", ") || "Any"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Locations:</span>{" "}
                                {buyer.locations?.join(", ") || "Any"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm flex items-center">
                                <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                                {formatCurrency(buyer.min_price)} - {formatCurrency(buyer.max_price)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Credit: {buyer.credit_score || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[buyer.status || "active"]?.color}>
                              {statusConfig[buyer.status || "active"]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(buyer.updated_at), "MMM d, yyyy")}
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
                                  <Link to={`/buyers/${buyer.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/buyers/${buyer.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Buyer
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/buyers/${buyer.id}?tab=matches`}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Find Matches
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/calendar?buyerId=${buyer.id}`}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Appointment
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(buyer.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this buyer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
