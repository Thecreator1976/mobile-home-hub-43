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
import { useIntegrations } from "@/hooks/useIntegrations";
import { toast } from "@/hooks/use-toast";
import { Phone, PhoneCall } from "lucide-react";

interface CallWithOpenPhoneButtonProps {
  lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string;
    city: string | null;
    state: string | null;
  };
}

export function CallWithOpenPhoneButton({ lead }: CallWithOpenPhoneButtonProps) {
  const { integrations, triggerWebhook } = useIntegrations();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const openPhoneIntegration = integrations.find(
    (i) => i.service_name === "openphone" && i.is_active
  );

  if (!openPhoneIntegration?.webhook_url) {
    return null;
  }

  if (!lead.phone) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Phone className="h-4 w-4 mr-2" />
        No Phone
      </Button>
    );
  }

  const handleCall = async () => {
    setSending(true);
    try {
      const payload = {
        event: "initiate_call",
        lead_id: lead.id,
        contact: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: `${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}`,
        },
        source: "mobilehome_crm",
      };

      const success = await triggerWebhook(openPhoneIntegration.webhook_url!, payload);
      
      if (success) {
        toast({
          title: "Call Initiated",
          description: `OpenPhone webhook triggered for ${lead.name}`,
        });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error triggering OpenPhone:", error);
      toast({
        title: "Error",
        description: "Failed to trigger OpenPhone webhook",
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
          <PhoneCall className="h-4 w-4 mr-2" />
          Call via OpenPhone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Call with OpenPhone</DialogTitle>
          <DialogDescription>
            Trigger your OpenPhone workflow to initiate a call
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lead.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{lead.phone}</p>
            {lead.email && (
              <p className="text-sm text-muted-foreground">{lead.email}</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            This will send the contact info to your OpenPhone Zapier workflow to initiate a call or create a contact.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCall} disabled={sending}>
            <PhoneCall className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Initiate Call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
