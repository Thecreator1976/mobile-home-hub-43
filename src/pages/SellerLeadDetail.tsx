import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  User,
  FileText,
  Clock,
  Plus,
  Send,
  Receipt,
  MessageSquare,
  Edit,
  Image as ImageIcon,
  File,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useSellerLead, useSellerLeads, LeadStatus } from "@/hooks/useSellerLeads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostToSocialButton } from "@/components/integrations/PostToSocialButton";
import { CallWithOpenPhoneButton } from "@/components/integrations/CallWithOpenPhoneButton";
import { SMSWithOpenPhoneButton } from "@/components/integrations/SMSWithOpenPhoneButton";

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800" },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  offer_made: { label: "Offer Made", color: "bg-purple-100 text-purple-800" },
  under_contract: { label: "Under Contract", color: "bg-orange-100 text-orange-800" },
  closed: { label: "Closed", color: "bg-green-100 text-green-800" },
  lost: { label: "Lost", color: "bg-red-100 text-red-800" },
};

const conditionLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function SellerLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading, error } = useSellerLead(id);
  const { updateLead } = useSellerLeads();
  const [newNote, setNewNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch timeline
  const { data: timeline = [] } = useQuery({
    queryKey: ["lead-timeline", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("lead_timeline")
        .select("*")
        .eq("seller_lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch expenses for this lead
  const { data: expenses = [] } = useQuery({
    queryKey: ["lead-expenses", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("seller_lead_id", id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatCurrency = (value: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    if (!lead || lead.status === newStatus) return;
    
    setUpdatingStatus(true);
    try {
      await updateLead.mutateAsync({ id: lead.id, status: newStatus });
      
      // Add timeline entry
      await supabase.from("lead_timeline").insert({
        seller_lead_id: lead.id,
        action: `Status changed to ${statusConfig[newStatus].label}`,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    
    const currentNotes = lead.notes || "";
    const timestamp = format(new Date(), "MMM d, yyyy h:mm a");
    const updatedNotes = `${currentNotes}\n\n[${timestamp}]\n${newNote}`.trim();
    
    await updateLead.mutateAsync({ id: lead.id, notes: updatedNotes });
    
    // Add timeline entry
    await supabase.from("lead_timeline").insert({
      seller_lead_id: lead.id,
      action: "Note added",
    });
    
    setNewNote("");
    toast({ title: "Note Added", description: "Your note has been saved." });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load lead details.</p>
          <Button variant="link" onClick={() => navigate("/seller-leads")}>
            Back to Seller Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const potentialProfit = (lead.estimated_value || 0) - (lead.target_offer || 0);
  const equity = (lead.asking_price || 0) - (lead.owed_amount || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/seller-leads">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
              <Badge className={statusConfig[lead.status].color}>
                {statusConfig[lead.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {lead.address}{lead.city && `, ${lead.city}`}{lead.state && `, ${lead.state}`} {lead.zip}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PostToSocialButton lead={lead} />
            <CallWithOpenPhoneButton lead={lead} />
            <SMSWithOpenPhoneButton lead={lead} />
            <Button variant="outline" asChild>
              <Link to={`/seller-leads/${lead.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/seller-leads/${lead.id}/make-offer`}>
                <FileText className="h-4 w-4 mr-2" />
                Make Offer
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex flex-wrap gap-3">
          {lead.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                {lead.phone}
              </a>
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                {lead.email}
              </a>
            </Button>
          )}
        </div>

        {/* Status Update Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusConfig) as LeadStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus || lead.status === status}
                >
                  {statusConfig[status].label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Asking Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(lead.asking_price)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Target Offer</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(lead.target_offer)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(lead.estimated_value)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Potential Profit</CardTitle>
                  <Receipt className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${potentialProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {formatCurrency(potentialProfit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                    <p className="text-sm">{lead.notes}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" disabled={!newNote.trim()} onClick={handleAddNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Home Type</p>
                      <p className="font-medium capitalize">{lead.home_type} Wide</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-medium">{lead.year_built || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">
                        {lead.length_ft && lead.width_ft 
                          ? `${lead.length_ft}' x ${lead.width_ft}' (${Number(lead.length_ft) * Number(lead.width_ft)} sq ft)`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <p className="font-medium">
                        {lead.condition ? `${conditionLabels[lead.condition]} (${lead.condition}/5)` : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Park Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Park Owned Land</p>
                      <p className="font-medium">{lead.park_owned ? "Yes" : "No"}</p>
                    </div>
                    {lead.park_owned && (
                      <div>
                        <p className="text-sm text-muted-foreground">Lot Rent</p>
                        <p className="font-medium">{formatCurrency(lead.lot_rent)}/month</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Deal analysis and potential profit calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Asking Price</p>
                    <p className="text-xl font-bold">{formatCurrency(lead.asking_price)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Amount Owed</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(lead.owed_amount)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Target Offer</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(lead.target_offer)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Estimated Value</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(lead.estimated_value)}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Seller Equity</p>
                      <p className={`text-2xl font-bold ${equity >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {formatCurrency(equity)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Asking - Owed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Potential Margin</p>
                      <p className={`text-2xl font-bold ${potentialProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {formatCurrency(potentialProfit)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Est. Value - Target</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {lead.target_offer 
                          ? `${((potentialProfit / lead.target_offer) * 100).toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Margin / Offer</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track costs associated with this lead</CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link to={`/expenses?leadId=${lead.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.expense_date && format(new Date(expense.expense_date), "MMM d, yyyy")}
                            {expense.category && ` • ${expense.category}`}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg mt-4">
                      <p className="font-semibold">Total Expenses</p>
                      <p className="font-bold text-primary">{formatCurrency(totalExpenses)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No expenses logged yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>History of all actions on this lead</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          {index < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents & Photos</CardTitle>
                  <CardDescription>Contracts, photos, and other files</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Photos</h4>
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No photos uploaded</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Documents</h4>
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={`/calendar?leadId=${lead.id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/expenses?leadId=${lead.id}`}>
              <DollarSign className="mr-2 h-4 w-4" />
              Log Expense
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
