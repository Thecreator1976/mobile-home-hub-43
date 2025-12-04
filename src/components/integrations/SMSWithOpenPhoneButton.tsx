import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIntegrations } from "@/hooks/useIntegrations";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";

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
  };
}

const conditionLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function SMSWithOpenPhoneButton({ lead }: SMSWithOpenPhoneButtonProps) {
  const { integrations, triggerWebhook } = useIntegrations();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
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
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
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
