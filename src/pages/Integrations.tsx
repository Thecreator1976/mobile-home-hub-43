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
import { useIntegrations, ExternalIntegration } from "@/hooks/useIntegrations";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  MoreHorizontal,
  Facebook,
  Zap,
  Webhook,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  ExternalLink,
  Send,
  FileSignature,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

const INTEGRATION_TYPES = [
  {
    id: "facebook_posting",
    name: "Facebook Posting",
    description: "Post listings to Facebook Page via Zapier/n8n",
    icon: Facebook,
    color: "bg-blue-500",
  },
  {
    id: "docusign",
    name: "DocuSign E-Signature",
    description: "Send contracts for electronic signature",
    icon: FileSignature,
    color: "bg-amber-500",
  },
  {
    id: "new_lead_notification",
    name: "New Lead Notification",
    description: "Notify when new seller lead is created",
    icon: Bell,
    color: "bg-green-500",
  },
  {
    id: "status_change",
    name: "Status Change Webhook",
    description: "Trigger when lead status changes",
    icon: Webhook,
    color: "bg-purple-500",
  },
];

export default function Integrations() {
  const { integrations, isLoading, createIntegration, updateIntegration, deleteIntegration, triggerWebhook } = useIntegrations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ExternalIntegration | null>(null);
  const [formData, setFormData] = useState({
    service_name: "",
    webhook_url: "",
  });
  const [testLoading, setTestLoading] = useState<string | null>(null);

  if (isLoading) {
    return <PageLoader text="Loading integrations..." />;
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect your CRM with Zapier, n8n, and other automation tools
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingIntegration(null);
                setFormData({ service_name: "", webhook_url: "" });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingIntegration ? "Edit Integration" : "Add Integration"}
                </DialogTitle>
                <DialogDescription>
                  Connect a Zapier or n8n webhook to automate your workflows
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingIntegration && (
                  <div className="space-y-2">
                    <Label>Integration Type</Label>
                    <div className="grid gap-2">
                      {INTEGRATION_TYPES.map((type) => {
                        const Icon = type.icon;
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
                            <div className="text-left">
                              <div className="font-medium">{type.name}</div>
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
                  {editingIntegration ? "Save Changes" : "Add Integration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Setup Instructions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Facebook className="h-6 w-6 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Facebook Posting via Zapier</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger</li>
                    <li>Select "Catch Hook" trigger event</li>
                    <li>Add "Facebook Pages" action</li>
                    <li>Map content from webhook data to post</li>
                  </ol>
                  <Button variant="link" className="px-0 h-auto" asChild>
                    <a href="https://zapier.com/apps/facebook-pages/integrations" target="_blank" rel="noopener noreferrer">
                      View Facebook Integration <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <FileSignature className="h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">DocuSign E-Signature via Zapier</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create a new Zap in Zapier</li>
                    <li>Choose "Webhooks by Zapier" as trigger</li>
                    <li>Add "DocuSign" action</li>
                    <li>Select "Create Signature Request"</li>
                    <li>Map recipient emails and document data</li>
                  </ol>
                  <Button variant="link" className="px-0 h-auto" asChild>
                    <a href="https://zapier.com/apps/docusign/integrations" target="_blank" rel="noopener noreferrer">
                      View DocuSign Integration <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Integrations</CardTitle>
            <CardDescription>
              {integrations.length} integration{integrations.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No integrations configured yet.</p>
                <p className="text-sm">Add your first integration to automate workflows.</p>
              </div>
            ) : (
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
                            {integration.is_active ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                            )}
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
                            {testLoading === integration.id ? "Testing..." : "Test"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingIntegration(integration);
                                setFormData({
                                  service_name: integration.service_name,
                                  webhook_url: integration.webhook_url || "",
                                });
                                setShowAddDialog(true);
                              }}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
