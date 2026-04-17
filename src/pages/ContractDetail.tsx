import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useContract, useContractStatusHistory, useUpdateContractWithHistory } from "@/hooks/useContracts";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Download,
  Edit,
  Send,
  Trash2,
  History,
  ExternalLink,
  RefreshCw,
  Loader2,
  Check,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  draft: { label: "Draft", variant: "secondary", color: "text-muted-foreground" },
  sent: { label: "Sent", variant: "default", color: "text-blue-600" },
  signed: { label: "Signed", variant: "outline", color: "text-green-600" },
  expired: { label: "Expired", variant: "destructive", color: "text-red-600" },
  voided: { label: "Voided", variant: "destructive", color: "text-orange-600" },
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: contract, isLoading, refetch } = useContract(id);
  const { data: statusHistory, isLoading: historyLoading } = useContractStatusHistory(id);
  const updateContractWithHistory = useUpdateContractWithHistory();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = () => {
    if (!contract) return;
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

  const handleEditStart = () => {
    if (contract) {
      setEditedContent(contract.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!contract || !editedContent) return;
    setIsSaving(true);
    try {
      await updateContractWithHistory.mutateAsync({
        id: contract.id,
        content: editedContent,
      });
      setIsEditing(false);
      toast({ title: "Contract Updated", description: "Your changes have been saved." });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!contract || !newStatus) return;
    setIsSaving(true);
    try {
      const updates: {
        id: string;
        status: string;
        _statusNotes: string;
        sent_at?: string;
        signed_at?: string;
      } = {
        id: contract.id,
        status: newStatus,
        _statusNotes: statusNotes,
      };

      if (newStatus === "sent" && contract.status !== "sent") {
        updates.sent_at = new Date().toISOString();
      }
      if (newStatus === "signed" && contract.status !== "signed") {
        updates.signed_at = new Date().toISOString();
      }

      await updateContractWithHistory.mutateAsync(updates);

      // Send email notification for signed contracts
      if (newStatus === "signed") {
        try {
          await supabase.functions.invoke("send-contract-notification", {
            body: { contract_id: contract.id, event: "signed" },
          });
        } catch (emailError) {
          console.error("Failed to send notification:", emailError);
        }
      }

      setStatusDialogOpen(false);
      setNewStatus("");
      setStatusNotes("");
      toast({ title: "Status Updated", description: `Contract status changed to ${newStatus}.` });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!contract?.seller_lead_id) return;
    setIsRegenerating(true);
    try {
      // Fetch the lead data using secure view
      const { data: lead, error: leadError } = await supabase
        .from("secure_seller_leads")
        .select("*")
        .eq("id", contract.seller_lead_id)
        .single();

      if (leadError || !lead) throw new Error("Lead not found");

      // Get template if exists
      let templateContent = undefined;
      if (contract.template_id) {
        const { data: template } = await supabase
          .from("contract_templates")
          .select("content")
          .eq("id", contract.template_id)
          .single();
        templateContent = template?.content;
      }

      // Call generate-contract function
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

      // Update contract with new content
      await updateContractWithHistory.mutateAsync({
        id: contract.id,
        content: data.contract,
        _statusNotes: "Contract regenerated",
      });

      setRegenerateDialogOpen(false);
      toast({ title: "Contract Regenerated", description: "The contract has been regenerated successfully." });
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to regenerate contract.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contract Not Found</h2>
          <p className="text-muted-foreground mb-4">The contract you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/contracts")}>Back to Contracts</Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[contract.status] || statusConfig.draft;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/contracts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Contract Details</h1>
              <p className="text-muted-foreground">
                {contract.template_name} • {contract.seller_lead?.name || "Unknown Lead"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="text-sm">
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contract Content
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleEditStart}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Created on {format(new Date(contract.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                  />
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{contract.content}</pre>
                  </div>
                )}
              </CardContent>
              {isEditing && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : statusHistory && statusHistory.length > 0 ? (
                  <div className="space-y-4">
                    {statusHistory.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          {index < statusHistory.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            {entry.old_status && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {entry.old_status}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {entry.new_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No status changes recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus(contract.status);
                    setStatusDialogOpen(true);
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Change Status
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setRegenerateDialogOpen(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Contract
                </Button>
                {contract.seller_lead_id && (
                  <Link to={`/seller-leads/${contract.seller_lead_id}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Lead
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Template</p>
                  <p className="text-sm">{contract.template_name}</p>
                </div>
                {contract.contract_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm capitalize">{contract.contract_type.replace(/_/g, " ")}</p>
                  </div>
                )}
                {contract.seller_lead && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lead</p>
                      <p className="text-sm">{contract.seller_lead.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property</p>
                      <p className="text-sm">
                        {contract.seller_lead.address}
                        {contract.seller_lead.city && `, ${contract.seller_lead.city}`}
                        {contract.seller_lead.state && `, ${contract.seller_lead.state}`}
                      </p>
                    </div>
                  </>
                )}
                {contract.sent_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sent At</p>
                    <p className="text-sm">{format(new Date(contract.sent_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
                {contract.signed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Signed At</p>
                    <p className="text-sm">{format(new Date(contract.signed_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Contract Status</DialogTitle>
            <DialogDescription>Update the status of this contract.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation */}
      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use AI to regenerate the contract using the original template and current lead data. The existing content will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
