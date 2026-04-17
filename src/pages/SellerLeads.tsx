import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSellerLeads } from "@/hooks/useSellerLeads";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerLeads() {
  const { leads, isLoading, deleteLead } = useSellerLeads();

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHomeType = (type: string | null) => {
    if (!type) return "-";
    return type.charAt(0).toUpperCase() + type.slice(1) + "-wide";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Leads</h1>
            <p className="text-muted-foreground">Manage your seller leads pipeline</p>
          </div>
          <Button asChild>
            <Link to="/seller-leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Asking Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Seller Leads Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first seller lead.
            </p>
            <Button asChild>
              <Link to="/seller-leads/new">Create First Lead</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Asking Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.city}, {lead.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatHomeType(lead.home_type)}
                        {lead.year_built && ` • ${lead.year_built}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lead.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(lead.asking_price)}</div>
                      {lead.target_offer && (
                        <div className="text-sm text-muted-foreground">
                          Target: {formatCurrency(lead.target_offer)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.source === 'scmobilehomebuyer' ? 'default' : lead.source === 'react-foundation' ? 'secondary' : 'outline'}>
                        {lead.source === 'scmobilehomebuyer' ? 'SC Buyer Site' : lead.source === 'react-foundation' ? 'Carolinas Market' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/seller-leads/${lead.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/seller-leads/${lead.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lead.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLead.mutate(lead.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
