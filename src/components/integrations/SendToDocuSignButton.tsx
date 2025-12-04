import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { FileSignature, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContractData {
  sellerName: string;
  sellerEmail: string;
  buyerName?: string;
  buyerEmail?: string;
  propertyAddress: string;
  purchasePrice: number;
  earnestMoney?: number;
  closingDate?: string;
  specialTerms?: string;
}

interface SendToDocuSignButtonProps {
  contractData: ContractData;
  onSuccess?: () => void;
}

export function SendToDocuSignButton({ contractData, onSuccess }: SendToDocuSignButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState({
    sellerEmail: contractData.sellerEmail || "",
    buyerEmail: contractData.buyerEmail || "",
    subject: `Contract for ${contractData.propertyAddress}`,
    message: "Please review and sign the attached contract.",
  });

  const { integrations, triggerWebhook } = useIntegrations();
  const { templates } = useContractTemplates();

  const docusignIntegration = integrations.find(
    i => i.service_name === "docusign" && i.is_active
  );

  const handleSend = async () => {
    if (!docusignIntegration?.webhook_url) {
      toast({
        title: "No DocuSign Integration",
        description: "Please configure DocuSign integration first in Admin → Integrations.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sellerEmail) {
      toast({
        title: "Email Required",
        description: "Please enter the seller's email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Get template content if selected
      const template = templates.find(t => t.id === selectedTemplate);
      let contractContent = template?.content || "";

      // Replace placeholders in template
      contractContent = contractContent
        .replace(/\[SELLER_NAME\]/g, contractData.sellerName)
        .replace(/\[BUYER_NAME\]/g, contractData.buyerName || "TBD")
        .replace(/\[PROPERTY_ADDRESS\]/g, contractData.propertyAddress)
        .replace(/\[PURCHASE_PRICE\]/g, formatCurrency(contractData.purchasePrice))
        .replace(/\[EARNEST_MONEY\]/g, formatCurrency(contractData.earnestMoney || 0))
        .replace(/\[CLOSING_DATE\]/g, contractData.closingDate || "TBD")
        .replace(/\[SPECIAL_TERMS\]/g, contractData.specialTerms || "None")
        .replace(/\[DATE\]/g, new Date().toLocaleDateString());

      await triggerWebhook(docusignIntegration.webhook_url, {
        event: "send_for_signature",
        envelope: {
          emailSubject: formData.subject,
          emailMessage: formData.message,
          recipients: {
            signers: [
              {
                email: formData.sellerEmail,
                name: contractData.sellerName,
                recipientId: "1",
                routingOrder: "1",
                role: "Seller",
              },
              ...(formData.buyerEmail ? [{
                email: formData.buyerEmail,
                name: contractData.buyerName || "Buyer",
                recipientId: "2",
                routingOrder: "2",
                role: "Buyer",
              }] : []),
            ],
          },
          documents: [{
            name: `Contract - ${contractData.propertyAddress}.pdf`,
            content: contractContent,
          }],
        },
        contract: {
          ...contractData,
          templateId: selectedTemplate,
          templateName: template?.name,
        },
      });

      toast({
        title: "Contract Sent",
        description: "Check Zapier to confirm DocuSign envelope was created.",
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error sending to DocuSign:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileSignature className="h-4 w-4 mr-2" />
        Send for Signature
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Contract for E-Signature</DialogTitle>
            <DialogDescription>
              Send this contract to DocuSign via Zapier for electronic signatures
            </DialogDescription>
          </DialogHeader>

          {!docusignIntegration && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                DocuSign integration not configured. Go to Admin → Integrations to set it up.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contract Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template (custom content)</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Seller Email *</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  value={formData.sellerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerEmail: e.target.value }))}
                  placeholder="seller@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Buyer Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerEmail: e.target.value }))}
                  placeholder="buyer@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">Contract Details:</p>
              <p>Property: {contractData.propertyAddress}</p>
              <p>Seller: {contractData.sellerName}</p>
              <p>Price: {formatCurrency(contractData.purchasePrice)}</p>
              {contractData.buyerName && <p>Buyer: {contractData.buyerName}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending || !docusignIntegration}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Send to DocuSign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
