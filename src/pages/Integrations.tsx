import { useState } from "react";
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
import { useIntegrations, ExternalIntegration } from "@/hooks/useIntegrations";
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
}

const INTEGRATION_SERVICES: IntegrationService[] = [
  {
    name: "docusign",
    displayName: "DocuSign",
    description: "Send contracts for electronic signature via Zapier webhook",
    icon: FileSignature,
    helpText: "Enter your Zapier webhook URL that triggers DocuSign envelope creation",
    docsUrl: "https://zapier.com/apps/docusign/integrations",
  },
  {
    name: "openphone",
    displayName: "OpenPhone",
    description: "Initiate calls and send SMS through Zapier/n8n workflows",
    icon: Phone,
    helpText: "Enter your Zapier/n8n webhook URL for OpenPhone actions",
    docsUrl: "https://zapier.com/apps/openphone/integrations",
  },
  {
    name: "facebook_messenger",
    displayName: "Facebook Messenger",
    description: "Manage messenger conversations with leads and buyers",
    icon: MessageCircle,
    helpText: "Configure your Facebook Messenger webhook for incoming messages",
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
  },
  {
    name: "zapier",
    displayName: "Zapier",
    description: "Connect to 5,000+ apps with custom automation workflows",
    icon: Zap,
    helpText: "Enter your general Zapier webhook URL for custom automations",
    docsUrl: "https://zapier.com/apps/webhooks/integrations",
  },
  {
    name: "google_calendar",
    displayName: "Google Calendar",
    description: "Sync appointments with your Google Calendar",
    icon: Calendar,
    helpText: "Enter your Zapier webhook URL to sync calendar events",
    docsUrl: "https://zapier.com/apps/google-calendar/integrations",
  },
  {
    name: "mailchimp",
    displayName: "Mailchimp",
    description: "Add leads to email marketing campaigns automatically",
    icon: Mail,
    helpText: "Enter your Zapier webhook URL for Mailchimp list management",
    docsUrl: "https://zapier.com/apps/mailchimp/integrations",
  },
  {
    name: "twilio_sms",
    displayName: "Twilio SMS",
    description: "Send SMS messages directly to leads and buyers",
    icon: MessageSquare,
    helpText: "Enter your Zapier/n8n webhook URL for Twilio SMS actions",
    docsUrl: "https://zapier.com/apps/twilio/integrations",
  },
  {
    name: "quickbooks",
    displayName: "QuickBooks",
    description: "Sync expenses and transactions with QuickBooks",
    icon: DollarSign,
    helpText: "Enter your Zapier webhook URL for QuickBooks sync",
    docsUrl: "https://zapier.com/apps/quickbooks-online/integrations",
  },
  {
    name: "slack",
    displayName: "Slack",
    description: "Get team notifications for new leads and status changes",
    icon: Hash,
    helpText: "Enter your Slack incoming webhook URL or Zapier webhook",
    docsUrl: "https://api.slack.com/messaging/webhooks",
  },
];

export default function Integrations() {
  const { integrations, isLoading, createIntegration, updateIntegration, deleteIntegration, triggerWebhook } = useIntegrations();
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<ExternalIntegration | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const getIntegrationForService = (serviceName: string): ExternalIntegration | undefined => {
    return integrations.find((i) => i.service_name === serviceName);
  };

  const handleConnect = (service: IntegrationService) => {
    setSelectedService(service);
    setSelectedIntegration(null);
    setWebhookUrl("");
    setIsActive(true);
    setConfigureDialogOpen(true);
  };

  const handleConfigure = (service: IntegrationService, integration: ExternalIntegration) => {
    setSelectedService(service);
    setSelectedIntegration(integration);
    setWebhookUrl(integration.webhook_url || "");
    setIsActive(integration.is_active ?? true);
    setConfigureDialogOpen(true);
  };

  const handleDisconnect = (service: IntegrationService, integration: ExternalIntegration) => {
    setSelectedService(service);
    setSelectedIntegration(integration);
    setDeleteDialogOpen(true);
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

    try {
      if (selectedIntegration) {
        await updateIntegration.mutateAsync({
          id: selectedIntegration.id,
          webhook_url: webhookUrl.trim(),
          is_active: isActive,
        });
      } else {
        await createIntegration.mutateAsync({
          service_name: selectedService.name,
          webhook_url: webhookUrl.trim(),
          config: { is_active: isActive },
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
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      await triggerWebhook(webhookUrl.trim(), {
        test: true,
        service: selectedService?.name,
        message: "Test webhook from Lovable CRM",
      });
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
              Connect with third-party services using webhooks and automation platforms
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATION_SERVICES.map((service) => {
            const integration = getIntegrationForService(service.name);
            const isConnected = !!integration;
            const Icon = service.icon;

            return (
              <Card key={service.name} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
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
                          <><Check className="h-3 w-3 mr-1" /> Connected</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-3">
                  {isConnected && integration.webhook_url && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="truncate" title={integration.webhook_url}>
                        <span className="font-medium">Webhook:</span> {integration.webhook_url}
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
                    {isConnected ? (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
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

      {/* Configure Dialog */}
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
            <DialogDescription>
              {selectedService?.helpText}
            </DialogDescription>
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
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Testing...</>
              ) : (
                "Test Webhook"
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={createIntegration.isPending || updateIntegration.isPending}
            >
              {(createIntegration.isPending || updateIntegration.isPending) ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
              ) : (
                selectedIntegration ? "Update" : "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Disconnecting...</>
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
