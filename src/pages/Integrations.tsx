import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntegrations, ExternalIntegration, IntegrationEventType } from "@/hooks/useIntegrations";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  FileSignature,
  Phone,
  MessageCircle,
  Zap,
  Calendar,
  Mail,
  MessageSquare,
  DollarSign,
  Hash,
  Settings,
  Loader2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IntegrationService {
  name: string;
  displayName: string;
  description: string;
  icon: LucideIcon;
  helpText: string;
  docsUrl?: string;
  supportedEvents: IntegrationEventType[];
}

const EVENT_OPTIONS: { value: IntegrationEventType; label: string }[] = [
  { value: "new_lead", label: "New Lead" },
  { value: "status_change", label: "Status Change" },
];

const INTEGRATION_SERVICES: IntegrationService[] = [
  {
    name: "docusign",
    displayName: "DocuSign",
    description: "Send contracts for electronic signature through your automation flow",
    icon: FileSignature,
    helpText: "Enter the webhook URL used to trigger your DocuSign automation",
    docsUrl: "https://zapier.com/apps/docusign/integrations",
    supportedEvents: ["status_change"],
  },
  {
    name: "openphone",
    displayName: "OpenPhone",
    description: "Trigger calling or SMS workflows when lead events happen",
    icon: Phone,
    helpText: "Enter the webhook URL used by your OpenPhone automation",
    docsUrl: "https://zapier.com/apps/openphone/integrations",
    supportedEvents: ["new_lead", "status_change"],
  },
  {
    name: "facebook_messenger",
    displayName: "Facebook Messenger",
    description: "Route CRM events into Messenger automation flows",
    icon: MessageCircle,
    helpText: "Enter the webhook URL used for your Messenger automation",
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
    supportedEvents: ["new_lead", "status_change"],
  },
  {
    name: "zapier",
    displayName: "Zapier",
    description: "Connect CRM events to thousands of external services",
    icon: Zap,
    helpText: "Enter your Zapier webhook URL",
    docsUrl: "https://zapier.com/apps/webhooks/integrations",
    supportedEvents: ["new_lead", "status_change"],
  },
  {
    name: "google_calendar",
    displayName: "Google Calendar",
    description: "Sync appointment and operational workflows through automations",
    icon: Calendar,
    helpText: "Enter the webhook URL used for your Google Calendar automation",
    docsUrl: "https://zapier.com/apps/google-calendar/integrations",
    supportedEvents: ["status_change"],
  },
  {
    name: "mailchimp",
    displayName: "Mailchimp",
    description: "Add leads to email marketing flows when new records arrive",
    icon: Mail,
    helpText: "Enter the webhook URL used for your Mailchimp automation",
    docsUrl: "https://zapier.com/apps/mailchimp/integrations",
    supportedEvents: ["new_lead"],
  },
  {
    name: "twilio_sms",
    displayName: "Twilio SMS",
    description: "Trigger SMS workflows from CRM lead events",
    icon: MessageSquare,
    helpText: "Enter the webhook URL used for your Twilio SMS automation",
    docsUrl: "https://zapier.com/apps/twilio/integrations",
    supportedEvents: ["new_lead", "status_change"],
  },
  {
    name: "quickbooks",
    displayName: "QuickBooks",
    description: "Sync operational data to accounting flows",
    icon: DollarSign,
    helpText: "Enter the webhook URL used for your QuickBooks automation",
    docsUrl: "https://zapier.com/apps/quickbooks-online/integrations",
    supportedEvents: ["status_change"],
  },
  {
    name: "slack",
    displayName: "Slack",
    description: "Send team notifications for CRM activity",
    icon: Hash,
    helpText: "Enter your Slack or automation webhook URL",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    supportedEvents: ["new_lead", "status_change"],
  },
];

export default function Integrations() {
  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    triggerWebhook,
  } = useIntegrations();

  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<ExternalIntegration | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<IntegrationEventType[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const integrationsByService = useMemo(() => {
    return new Map(integrations.map((integration) => [integration.service_name, integration]));
  }, [integrations]);

  const getConfiguredEvents = (integration?: ExternalIntegration | null) => {
    const config = integration?.config;
    const configEvents =
      config && typeof config === "object" && !Array.isArray(config)
        ? (config as Record<string, unknown>).events
        : undefined;
    if (Array.isArray(configEvents)) {
      return configEvents.filter(
        (value): value is IntegrationEventType =>
          value === "new_lead" || value === "status_change"
      );
    }
    return [];
  };

  const handleConnect = (service: IntegrationService) => {
    setSelectedService(service);
    setSelectedIntegration(null);
    setWebhookUrl("");
    setIsActive(true);
    setSelectedEvents(service.supportedEvents);
    setConfigureDialogOpen(true);
  };

  const handleConfigure = (service: IntegrationService, integration: ExternalIntegration) => {
    setSelectedService(service);
    setSelectedIntegration(integration);
    setWebhookUrl(integration.webhook_url || "");
    setIsActive(integration.is_active ?? true);

    const configEvents = getConfiguredEvents(integration);
    setSelectedEvents(configEvents.length > 0 ? configEvents : service.supportedEvents);

    setConfigureDialogOpen(true);
  };

  const handleDisconnect = (service: IntegrationService, integration: ExternalIntegration) => {
    setSelectedService(service);
    setSelectedIntegration(integration);
    setDeleteDialogOpen(true);
  };

  const toggleEvent = (event: IntegrationEventType) => {
    setSelectedEvents((current) =>
      current.includes(event)
        ? current.filter((value) => value !== event)
        : [...current, event]
    );
  };

  const handleSave = async () => {
    if (!selectedService) return;

    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: "Error",
        description: "Select at least one event for this integration.",
        variant: "destructive",
      });
      return;
    }

    const payloadConfig = {
      is_active: isActive,
      events: selectedEvents,
    };

    try {
      if (selectedIntegration) {
        await updateIntegration.mutateAsync({
          id: selectedIntegration.id,
          webhook_url: webhookUrl.trim(),
          is_active: isActive,
          config: payloadConfig,
        });
      } else {
        await createIntegration.mutateAsync({
          service_name: selectedService.name,
          webhook_url: webhookUrl.trim(),
          config: payloadConfig,
        });
      }

      setConfigureDialogOpen(false);
    } catch (error) {
      console.error("Error saving integration:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedIntegration) return;

    try {
      await deleteIntegration.mutateAsync(selectedIntegration.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting integration:", error);
    }
  };

  const handleTestWebhook = async () => {
    if (!selectedService || !webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const ok = await triggerWebhook(webhookUrl.trim(), {
        test: true,
        service_name: selectedService.name,
        supported_events: selectedEvents,
        message: `Test webhook from MobileHome CRM for ${selectedService.displayName}`,
      });

      if (!ok) {
        toast({
          title: "Webhook test failed",
          description: "The webhook request did not succeed. Verify the URL.",
          variant: "destructive",
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">
              Connect CRM events to external automation services with webhooks
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATION_SERVICES.map((service) => {
            const integration = integrationsByService.get(service.name);
            const isConnected = !!integration;
            const Icon = service.icon;
            const events = getConfiguredEvents(integration);

            return (
              <Card key={service.name} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.displayName}</CardTitle>
                      </div>
                    </div>

                    {isConnected && (
                      <Badge variant={integration.is_active ? "default" : "secondary"} className="shrink-0">
                        {integration.is_active ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    )}
                  </div>

                  <CardDescription className="mt-2">{service.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-end space-y-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Supported events:</span>{" "}
                    {service.supportedEvents
                      .map((event) =>
                        EVENT_OPTIONS.find((option) => option.value === event)?.label || event
                      )
                      .join(", ")}
                  </div>

                  {isConnected && integration.webhook_url && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="truncate" title={integration.webhook_url}>
                        <span className="font-medium">Webhook:</span> {integration.webhook_url}
                      </p>

                      <p>
                        <span className="font-medium">Events:</span>{" "}
                        {(events.length > 0 ? events : service.supportedEvents)
                          .map((event) =>
                            EVENT_OPTIONS.find((option) => option.value === event)?.label || event
                          )
                          .join(", ")}
                      </p>

                      {integration.last_sync && (
                        <p>
                          <span className="font-medium">Last sync:</span>{" "}
                          {format(new Date(integration.last_sync), "MMM d, yyyy h:mm a")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isConnected && integration ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleConfigure(service, integration)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnect(service, integration)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleConnect(service)}
                        >
                          Connect
                        </Button>

                        {service.docsUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={configureDialogOpen} onOpenChange={setConfigureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedService && (
                <>
                  <selectedService.icon className="h-5 w-5" />
                  {selectedIntegration ? "Configure" : "Connect"} {selectedService.displayName}
                </>
              )}
            </DialogTitle>
            <DialogDescription>{selectedService?.helpText}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://hooks.zapier.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Events</Label>
              <div className="space-y-2 rounded-md border p-3">
                {selectedService?.supportedEvents.map((event) => {
                  const option = EVENT_OPTIONS.find((item) => item.value === event);
                  return (
                    <label key={event} className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm">{option?.label || event}</span>
                      <Switch
                        checked={selectedEvents.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select which CRM events should trigger this integration.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active-toggle">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable this integration
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {selectedService?.docsUrl && (
              <a
                href={selectedService.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View integration documentation
              </a>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleTestWebhook}
              disabled={isTesting || !webhookUrl.trim()}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Webhook"
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={createIntegration.isPending || updateIntegration.isPending}
            >
              {createIntegration.isPending || updateIntegration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : selectedIntegration ? (
                "Update"
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {selectedService?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the integration and stop all webhook triggers. You can reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIntegration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
