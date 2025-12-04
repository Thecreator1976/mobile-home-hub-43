import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseOrders, POStatus } from "@/hooks/usePurchaseOrders";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Printer, FileText, Building, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<POStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800" },
  received: { label: "Received", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function PurchaseOrders() {
  const { purchaseOrders, isLoading, updatePO, deletePO } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        !searchTerm ||
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.seller_lead?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      await deletePO.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: POStatus) => {
    await updatePO.mutateAsync({ id, status: newStatus });
  };

  const totalValue = filteredOrders.reduce((sum, po) => sum + Number(po.total_amount), 0);
  const pendingCount = purchaseOrders.filter((po) => po.status === "sent").length;
  const paidCount = purchaseOrders.filter((po) => po.status === "paid").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
            <p className="text-muted-foreground">Create and manage purchase orders for repairs and improvements</p>
          </div>
          <Button asChild>
            <Link to="/purchase-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total POs</p>
                  <p className="text-2xl font-bold">{purchaseOrders.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search POs..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} • Total: {formatCurrency(totalValue)}
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
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Related Lead</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No purchase orders found. Create your first PO to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((po) => (
                        <TableRow key={po.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center font-medium">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              {po.po_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                              {po.vendor}
                            </div>
                          </TableCell>
                          <TableCell>
                            {po.seller_lead ? (
                              <Link
                                to={`/seller-leads/${po.seller_lead_id}`}
                                className="text-primary hover:underline"
                              >
                                {po.seller_lead.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Not linked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(Number(po.total_amount))}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[po.status].color}>
                              {statusConfig[po.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(po.created_at), "MMM d, yyyy")}
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
                                  <Link to={`/purchase-orders/${po.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/purchase-orders/${po.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                                {(["draft", "sent", "received", "paid"] as POStatus[]).map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => handleStatusChange(po.id, status)}
                                    disabled={po.status === status}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as {statusConfig[status].label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(po.id)}
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
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
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
