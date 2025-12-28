import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2, Phone, Mail, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useBuyers } from "@/hooks/useBuyers";
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

export default function Buyers() {
  const { buyers, isLoading, deleteBuyer } = useBuyers();

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHomeTypes = (types: string[] | null) => {
    if (!types || types.length === 0) return "-";
    return types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "closed":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
            <p className="text-muted-foreground">Manage your buyer database</p>
          </div>
          <Button asChild>
            <Link to="/buyers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Buyer
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
                  <TableHead>Budget</TableHead>
                  <TableHead>Preferences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : buyers.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Buyers Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first buyer.
            </p>
            <Button asChild>
              <Link to="/buyers/new">Add First Buyer</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Preferences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell>
                      <div className="font-medium">{buyer.name}</div>
                      {buyer.credit_score && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          Credit: {buyer.credit_score}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {buyer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {buyer.phone}
                          </div>
                        )}
                        {buyer.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {buyer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCurrency(buyer.min_price)} - {formatCurrency(buyer.max_price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatHomeTypes(buyer.home_types)}
                      </div>
                      {buyer.locations && buyer.locations.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {buyer.locations.slice(0, 2).join(", ")}
                          {buyer.locations.length > 2 && ` +${buyer.locations.length - 2} more`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(buyer.status)}>
                        {buyer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/buyers/${buyer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/buyers/${buyer.id}/edit`}>
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
                              <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{buyer.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBuyer.mutate(buyer.id)}
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
