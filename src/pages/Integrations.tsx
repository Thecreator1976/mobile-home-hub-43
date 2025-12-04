import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/loading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIntegrations, ExternalIntegration } from "@/hooks/useIntegrations";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  MoreHorizontal,
  Facebook,
  Webhook,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  ExternalLink,
  Send,
  FileSignature,
  Bell,
  Phone,
  MessageSquare,
  Calendar,
  Settings,
} from "lucide-react";
import { format } from "date-fns";

const INTEGRATION_TYPES = [
  {
    id: "facebook_posting",
    name: "Facebook Posting",
    description: "Post listings to Facebook Page via Zapier/n8n",
    icon: Facebook,
    color: "bg-blue-500",
    features: ["Page Posts", "Marketplace (Manual)", "Messenger Leads"],
  },
  {
    id: "docusign",
    name: "DocuSign E-Signature",
    description: "Send contracts for electronic signature",
    icon: FileSignature,
    color: "bg-amber-500",
    features: ["Signature Requests", "Template Library", "Status Tracking"],
  },
  {
    id: "openphone",
    name: "OpenPhone",
    description: "Sync calls, SMS, and contacts with OpenPhone",
    icon: Phone,
    color: "bg-emerald-500",
    features: ["Call Logging", "SMS Sync", "Contact Sync"],
  },
  {
    id: "new_lead_notification",
    name: "New Lead Notification",
    description: "Notify when new seller lead is created",
    icon: Bell,
    color: "bg-green-500",
    features: ["Instant Alerts", "Slack/Email", "Custom Filters"],
  },
  {
    id: "status_change",
    name: "Status Change Webhook",
    description: "Trigger when lead status changes",
    icon: Webhook,
    color: "bg-purple-500",
    features: ["Pipeline Automation", "Task Creation", "Notifications"],
  },
];

export default function Integrations() {
  const { integrations, isLoading, createIntegration, updateIntegration, deleteIntegration, triggerWebhook } = useIntegrations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ExternalIntegration | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    service_name: "",
    webhook_url: "",
  });
  const [testLoading, setTestLoading] = useState<string | null>(null);

  if (isLoading) {
    return <PageLoader text="Loading integrations..." />;
  }

  const getIntegrationForType = (typeId: string) => {
    return integrations.find(i => i.service_name === typeId);
  };

  const handleSubmit = async () => {
    if (!formData.service_name || !formData.webhook_url) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editingIntegration) {
      await updateIntegration.mutateAsync({
        id: editingIntegration.id,
        webhook_url: formData.webhook_url,
      });
    } else {
      await createIntegration.mutateAsync({
        service_name: formData.service_name,
        webhook_url: formData.webhook_url,
      });
    }

    setShowAddDialog(false);
    setEditingIntegration(null);
    setSelectedType(null);
    setFormData({ service_name: "", webhook_url: "" });
  };

  const handleTest = async (integration: ExternalIntegration) => {
    if (!integration.webhook_url) return;
    
    setTestLoading(integration.id);
    await triggerWebhook(integration.webhook_url, {
      event: "test",
      message: "This is a test from MobileHome CRM",
    });
    setTestLoading(null);
  };

  const handleToggleActive = async (integration: ExternalIntegration) => {
    await updateIntegration.mutateAsync({
      id: integration.id,
      is_active: !integration.is_active,
    });
  };

  const handleQuickConnect = (typeId: string) => {
    setSelectedType(typeId);
    setFormData({ service_name: typeId, webhook_url: "" });
    setEditingIntegration(null);
    setShowAddDialog(true);
  };

  const handleEditIntegration = (integration: ExternalIntegration) => {
    setEditingIntegration(integration);
    setSelectedType(integration.service_name);
    setFormData({
      service_name: integration.service_name,
      webhook_url: integration.webhook_url || "",
    });
    setShowAddDialog(true);
  };

  const getIntegrationIcon = (serviceName: string) => {
    const type = INTEGRATION_TYPES.find(t => t.id === serviceName);
    if (type) {
      const Icon = type.icon;
      return <Icon className="h-5 w-5" />;
    }
    return <Webhook className="h-5 w-5" />;
  };

  const getIntegrationName = (serviceName: string) => {
    const type = INTEGRATION_TYPES.find(t => t.id === serviceName);
    return type?.name || serviceName;
  };

  const connectedCount = INTEGRATION_TYPES.filter(t => getIntegrationForType(t.id)?.is_active).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Integrations</h1>
            <p className="text-muted-foreground mt-1">
              {connectedCount} of {INTEGRATION_TYPES.length} integrations connected
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setSelectedType(null);
              setEditingIntegration(null);
              setFormData({ service_name: "", webhook_url: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingIntegration(null);
                setSelectedType(null);
                setFormData({ service_name: "", webhook_url: "" });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration ? "Edit Integration" : selectedType ? `Connect ${getIntegrationName(selectedType)}` : "Add Integration"}
                </DialogTitle>
                <DialogDescription>
                  Connect a Zapier or n8n webhook to automate your workflows
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingIntegration && !selectedType && (
                  <div className="space-y-2">
                    <Label>Integration Type</Label>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                      {INTEGRATION_TYPES.map((type) => {
                        const Icon = type.icon;
                        const existing = getIntegrationForType(type.id);
                        return (
                          <button
                            key={type.id}
                            onClick={() => setFormData(prev => ({ ...prev, service_name: type.id }))}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              formData.service_name === type.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className={`p-2 rounded-md ${type.color} text-white`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {type.name}
                                {existing && (
                                  <Badge variant="outline" className="text-xs">
                                    {existing.is_active ? "Connected" : "Inactive"}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste your Zapier or n8n webhook URL here
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createIntegration.isPending || updateIntegration.isPending}
                >
                  {editingIntegration ? "Save Changes" : "Connect"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Integration Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATION_TYPES.map((type) => {
            const Icon = type.icon;
            const integration = getIntegrationForType(type.id);
            const isConnected = integration?.is_active;

            return (
              <Card key={type.id} className={isConnected ? "border-primary/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${type.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{type.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Features List */}
                  <div className="flex flex-wrap gap-1.5">
                    {type.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {isConnected ? (
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                        )}
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {integration ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(integration)}
                          disabled={testLoading === integration.id}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditIntegration(integration)}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleQuickConnect(type.id)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Setup Instructions Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Guides</CardTitle>
            <CardDescription>Step-by-step instructions for each integration</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="facebook">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    Facebook Posting via Zapier
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-4">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger → Select "Catch Hook"</li>
                    <li>Copy the webhook URL and paste it here</li>
                    <li>Add "Facebook Pages" as action</li>
                    <li>Connect your Facebook Business Page</li>
                    <li>Map the webhook data: content → message, media_urls → attachments</li>
                  </ol>
                  <Button variant="link" className="px-0 h-auto mt-2" asChild>
                    <a href="https://zapier.com/apps/facebook-pages/integrations" target="_blank" rel="noopener noreferrer">
                      View Zapier Documentation <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="docusign">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-amber-500" />
                    DocuSign E-Signature via Zapier
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-4">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger → Select "Catch Hook"</li>
                    <li>Copy the webhook URL and paste it here</li>
                    <li>Add "DocuSign" as action → Select "Create Signature Request"</li>
                    <li>Connect your DocuSign account</li>
                    <li>Map: recipient_email → Signer Email, contract_content → Document</li>
                  </ol>
                  <Button variant="link" className="px-0 h-auto mt-2" asChild>
                    <a href="https://zapier.com/apps/docusign/integrations" target="_blank" rel="noopener noreferrer">
                      View DocuSign Integration <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="openphone">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    OpenPhone via Zapier
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-4">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger → Select "Catch Hook"</li>
                    <li>Copy the webhook URL and paste it here</li>
                    <li>Add "OpenPhone" as action</li>
                    <li>Select action type: Send SMS, Create Contact, or Log Call</li>
                    <li>Map: contact.phone → Phone Number, contact.name → Contact Name</li>
                  </ol>
                  <Button variant="link" className="px-0 h-auto mt-2" asChild>
                    <a href="https://zapier.com/apps/openphone/integrations" target="_blank" rel="noopener noreferrer">
                      View OpenPhone Integration <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notifications">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-green-500" />
                    Lead Notifications
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-4">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger → Select "Catch Hook"</li>
                    <li>Copy the webhook URL and paste it here</li>
                    <li>Add notification action: Slack, Email, SMS, or Push Notification</li>
                    <li>Configure the message template with lead details</li>
                    <li>Test by creating a new lead in the CRM</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Configured Integrations Table */}
        {integrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
              <CardDescription>
                Manage your active webhook connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Webhook URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIntegrationIcon(integration.service_name)}
                          <span className="font-medium">{getIntegrationName(integration.service_name)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                          {integration.webhook_url || "Not set"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={integration.is_active}
                            onCheckedChange={() => handleToggleActive(integration)}
                          />
                          <Badge variant={integration.is_active ? "default" : "secondary"}>
                            {integration.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {integration.last_sync 
                          ? format(new Date(integration.last_sync), "MMM d, yyyy HH:mm")
                          : "Never"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(integration)}
                            disabled={!integration.webhook_url || testLoading === integration.id}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {testLoading === integration.id ? "..." : "Test"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditIntegration(integration)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteIntegration.mutate(integration.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
