import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

// Mock data for a single lead
const mockLead = {
  id: "1",
  name: "John Smith",
  phone: "(555) 123-4567",
  email: "john.smith@email.com",
  address: "123 Oak Lane, Mobile Home Park A, Phoenix AZ 85001",
  homeType: "double" as const,
  yearBuilt: 1998,
  condition: 3,
  dimensions: { length: 56, width: 28 },
  parkOwned: true,
  lotRent: 450,
  askingPrice: 45000,
  owedAmount: 12000,
  estimatedValue: 40000,
  targetOffer: 35000,
  status: "contacted" as const,
  createdAt: "2024-01-15",
  notes: "Motivated seller, relocating for work. Wants to close within 60 days.",
  timeline: [
    { action: "Lead created", date: "2024-01-15", user: "System" },
    { action: "Initial contact made", date: "2024-01-16", user: "John Agent" },
    { action: "Property viewing scheduled", date: "2024-01-17", user: "John Agent" },
  ],
  expenses: [
    { id: "e1", description: "Marketing materials", amount: 150, date: "2024-01-16" },
    { id: "e2", description: "Travel to property", amount: 45, date: "2024-01-17" },
  ],
};

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  offer: "Offer Made",
  contract: "Under Contract",
  closed: "Closed",
  lost: "Lost",
};

const conditionLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function SellerLeadDetail() {
  const { id } = useParams();
  const [newNote, setNewNote] = useState("");
  const lead = mockLead; // In real app, fetch by id

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/seller-leads">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
              <Badge variant={lead.status} className="text-sm">{statusLabels[lead.status]}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {lead.address}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Contract
            </Button>
            <Button variant="gradient">
              <Send className="h-4 w-4 mr-2" />
              Send Offer
            </Button>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              {lead.phone}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${lead.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              {lead.email}
            </a>
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="property">Property Details</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Asking Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(lead.askingPrice)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Target Offer</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(lead.targetOffer)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(lead.estimatedValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Amount Owed</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(lead.owedAmount)}</p>
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
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{lead.notes}</p>
                  <p className="text-xs text-muted-foreground mt-2">Added on {lead.createdAt}</p>
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" disabled={!newNote.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Home Type</p>
                      <p className="font-medium capitalize">{lead.homeType} Wide</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-medium">{lead.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">{lead.dimensions.length}' x {lead.dimensions.width}'</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <p className="font-medium">{conditionLabels[lead.condition]} ({lead.condition}/5)</p>
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
                      <p className="text-sm text-muted-foreground">Park Owned</p>
                      <p className="font-medium">{lead.parkOwned ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lot Rent</p>
                      <p className="font-medium">{formatCurrency(lead.lotRent)}/month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financials">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Deal analysis and potential profit calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Asking Price</p>
                      <p className="text-xl font-bold">{formatCurrency(lead.askingPrice)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Target Offer</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(lead.targetOffer)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="text-xl font-bold">{formatCurrency(lead.estimatedValue)}</p>
                    </div>
                    <div className="p-4 bg-status-closed/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Potential Profit</p>
                      <p className="text-xl font-bold text-status-closed">
                        {formatCurrency(lead.estimatedValue - lead.targetOffer)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track costs associated with this lead</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lead.expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{expense.date}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg mt-4">
                    <p className="font-semibold">Total Expenses</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(lead.expenses.reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>History of all actions on this lead</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lead.timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < lead.timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.date} • {item.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Contracts, photos, and other files</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <Button variant="link">Upload your first document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
