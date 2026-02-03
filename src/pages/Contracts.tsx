import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useContracts, Contract, useUpdateContractWithHistory } from "@/hooks/useContracts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Send,
  ExternalLink,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  signed: { label: "Signed", variant: "outline" },
  expired: { label: "Expired", variant: "destructive" },
  voided: { label: "Voided", variant: "destructive" },
};

export default function Contracts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { contracts, isLoading, deleteContract, isDeleting } = useContracts();
  const updateContractWithHistory = useUpdateContractWithHistory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      searchQuery === "" ||
      contract.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.seller_lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.seller_lead?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownload = (contract: Contract) => {
    const blob = new Blob([contract.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contract_${contract.seller_lead?.name?.replace(/\s+/g, "_") || "unknown"}_${format(new Date(contract.created_at), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (contractToDelete) {
      await deleteContract(contractToDelete);
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  const handleMarkAsSent = async (contract: Contract) => {
    await updateContractWithHistory.mutateAsync({
      id: contract.id,
      status: "sent",
      sent_at: new Date().toISOString(),
      _statusNotes: "Marked as sent",
    });
  };

  const handleRegenerate = async (contract: Contract) => {
    if (!contract.seller_lead_id) {
      toast({ title: "Error", description: "No lead associated with this contract.", variant: "destructive" });
      return;
    }
    
    setRegeneratingId(contract.id);
    try {
      const { data: lead, error: leadError } = await supabase
        .from("secure_seller_leads")
        .select("*")
        .eq("id", contract.seller_lead_id)
        .single();

      if (leadError || !lead) throw new Error("Lead not found");

      let templateContent = undefined;
      if (contract.template_id) {
        const { data: template } = await supabase
          .from("contract_templates")
          .select("content")
          .eq("id", contract.template_id)
          .single();
        templateContent = template?.content;
      }

      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: {
          leadData: {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            zip: lead.zip,
            home_type: lead.home_type || "single",
            year_built: lead.year_built,
            asking_price: lead.asking_price,
            target_offer: lead.target_offer,
            lot_rent: lead.lot_rent,
            condition: lead.condition,
            notes: lead.notes,
          },
          offerData: contract.offer_data || {},
          templateContent,
          templateId: contract.template_id,
          customizationNotes: lead.notes,
          contractType: contract.contract_type || "purchase_agreement",
        },
      });

      if (error) throw error;

      await updateContractWithHistory.mutateAsync({
        id: contract.id,
        content: data.contract,
        _statusNotes: "Contract regenerated",
      });

      toast({ title: "Contract Regenerated", description: "The contract has been regenerated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to regenerate contract.", variant: "destructive" });
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all generated contracts
            </p>
          </div>
          {userRole === "admin" && (
            <Button variant="outline" onClick={() => navigate("/admin/contract-templates")}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Templates
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by lead name, address, or template..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="voided">Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Contracts
            </CardTitle>
            <CardDescription>
              {filteredContracts.length} contract{filteredContracts.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Contracts Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "No contracts match your search criteria."
                    : "Generate contracts from the Make Offer page."}
                </p>
                <Button onClick={() => navigate("/seller-leads")}>
                  Go to Seller Leads
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => {
                      const status = statusConfig[contract.status] || statusConfig.draft;
                      const isRegenerating = regeneratingId === contract.id;
                      return (
                        <TableRow 
                          key={contract.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{contract.seller_lead?.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">
                                {contract.seller_lead?.address}
                                {contract.seller_lead?.city && `, ${contract.seller_lead.city}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{contract.template_name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {format(new Date(contract.created_at), "MMM d, yyyy")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  {isRegenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedContract(contract)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Quick Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(contract)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRegenerate(contract)}
                                  disabled={isRegenerating || !contract.seller_lead_id}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Regenerate
                                </DropdownMenuItem>
                                {contract.seller_lead && (
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/seller-leads/${contract.seller_lead_id}`)}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Lead
                                  </DropdownMenuItem>
                                )}
                                {contract.status === "draft" && (
                                  <DropdownMenuItem onClick={() => handleMarkAsSent(contract)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setContractToDelete(contract.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Contract Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
            <DialogDescription>
              {selectedContract?.template_name} • Created{" "}
              {selectedContract && format(new Date(selectedContract.created_at), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-muted/30 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {selectedContract?.content}
            </pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedContract(null)}>
              Close
            </Button>
            {selectedContract && (
              <Button onClick={() => handleDownload(selectedContract)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The contract will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
