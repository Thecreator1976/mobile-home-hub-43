import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useSMSTemplates } from "@/hooks/useSMSTemplates";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, FileText } from "lucide-react";

interface SMSWithOpenPhoneButtonProps {
  lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string;
    city: string | null;
    state: string | null;
    asking_price: number;
    home_type: string | null;
    year_built: number | null;
    condition: number | null;
    target_offer?: number | null;
  };
}

const conditionLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function SMSWithOpenPhoneButton({ lead }: SMSWithOpenPhoneButtonProps) {
  const { integrations, triggerWebhook } = useIntegrations();
  const { templates, applyTemplate } = useSMSTemplates();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const defaultMessage = `Hi ${lead.name},

Thank you for your interest in selling your mobile home at ${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}.

Property Details:
• Type: ${lead.home_type ? `${lead.home_type.charAt(0).toUpperCase() + lead.home_type.slice(1)} Wide` : "N/A"}
• Year: ${lead.year_built || "N/A"}
• Condition: ${lead.condition ? conditionLabels[lead.condition] : "N/A"}
• Asking: $${lead.asking_price?.toLocaleString() || "N/A"}

I'd love to discuss this further. When would be a good time to talk?

Best regards`;

  const [message, setMessage] = useState(defaultMessage);

  const openPhoneIntegration = integrations.find(
    (i) => i.service_name === "openphone" && i.is_active
  );

  // Apply selected template
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== "custom") {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        const appliedMessage = applyTemplate(template.content, {
          name: lead.name,
          address: lead.address,
          city: lead.city || undefined,
          state: lead.state || undefined,
          asking_price: lead.asking_price,
          target_offer: lead.target_offer || undefined,
        });
        setMessage(appliedMessage);
      }
    } else if (selectedTemplate === "custom") {
      setMessage(defaultMessage);
    }
  }, [selectedTemplate, templates, lead]);

  if (!openPhoneIntegration?.webhook_url) {
    return null;
  }

  if (!lead.phone) {
    return (
      <Button variant="outline" size="sm" disabled>
        <MessageSquare className="h-4 w-4 mr-2" />
        No Phone
      </Button>
    );
  }

  const handleSendSMS = async () => {
    setSending(true);
    try {
      const payload = {
        event: "send_sms",
        lead_id: lead.id,
        recipient: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
        },
        message: message,
        property: {
          address: `${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}`,
          type: lead.home_type,
          year_built: lead.year_built,
          condition: lead.condition ? conditionLabels[lead.condition] : null,
          asking_price: lead.asking_price,
        },
        source: "mobilehome_crm",
      };

      const success = await triggerWebhook(openPhoneIntegration.webhook_url!, payload);
      
      if (success) {
        toast({
          title: "SMS Sent",
          description: `Message queued for ${lead.name}`,
        });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Error",
        description: "Failed to send SMS via OpenPhone",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          SMS via OpenPhone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send SMS via OpenPhone</DialogTitle>
          <DialogDescription>
            Send a text message to {lead.name} at {lead.phone}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Message Template
            </Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or write custom..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Message</SelectItem>
                {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {category.replace("_", " ")}
                    </div>
                    {categoryTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters • Placeholders: [NAME], [ADDRESS], [ASKING_PRICE], [OFFER_AMOUNT]
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendSMS} disabled={sending || !message.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
