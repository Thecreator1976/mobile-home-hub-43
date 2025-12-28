import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, DollarSign, Home, MapPin, Info } from "lucide-react";
import { useSellerLead, useSellerLeads, HomeType, LeadStatus } from "@/hooks/useSellerLeads";

export default function EditSellerLead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useSellerLead(id);
  const { updateLead } = useSellerLeads();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    askingPrice: "",
    targetOffer: "",
    estimatedValue: "",
    owedAmount: "",
    lotRent: "",
    homeType: "single" as HomeType,
    yearBuilt: "",
    widthFt: "",
    lengthFt: "",
    condition: "",
    parkOwned: true,
    notes: "",
    status: "new" as LeadStatus,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        zip: lead.zip || "",
        askingPrice: lead.asking_price?.toString() || "",
        targetOffer: lead.target_offer?.toString() || "",
        estimatedValue: lead.estimated_value?.toString() || "",
        owedAmount: lead.owed_amount?.toString() || "",
        lotRent: lead.lot_rent?.toString() || "",
        homeType: lead.home_type || "single",
        yearBuilt: lead.year_built?.toString() || "",
        widthFt: lead.width_ft?.toString() || "",
        lengthFt: lead.length_ft?.toString() || "",
        condition: lead.condition?.toString() || "",
        parkOwned: lead.park_owned ?? true,
        notes: lead.notes || "",
        status: lead.status || "new",
      });
    }
  }, [lead]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    updateLead.mutate(
      {
        id,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        asking_price: parseInt(formData.askingPrice) || 0,
        target_offer: formData.targetOffer ? parseInt(formData.targetOffer) : null,
        estimated_value: formData.estimatedValue ? parseInt(formData.estimatedValue) : null,
        owed_amount: formData.owedAmount ? parseInt(formData.owedAmount) : null,
        lot_rent: formData.lotRent ? parseInt(formData.lotRent) : null,
        home_type: formData.homeType,
        year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        width_ft: formData.widthFt ? parseInt(formData.widthFt) : null,
        length_ft: formData.lengthFt ? parseInt(formData.lengthFt) : null,
        condition: formData.condition ? parseInt(formData.condition) : null,
        park_owned: formData.parkOwned,
        notes: formData.notes || null,
        status: formData.status,
      },
      {
        onSuccess: () => {
          navigate(`/seller-leads/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Lead not found</p>
          <Button asChild>
            <Link to="/seller-leads">Back to Seller Leads</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" type="button" asChild>
            <Link to={`/seller-leads/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Edit Lead</h1>
            <p className="text-muted-foreground">Update seller lead information</p>
          </div>
          <Button type="submit" disabled={updateLead.isPending || !formData.name.trim() || !formData.address.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {updateLead.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Seller Information
              </CardTitle>
              <CardDescription>Contact details for the seller</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seller Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Property Address
              </CardTitle>
              <CardDescription>Location of the mobile home</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Mobile Home Park Dr, Lot 45"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Phoenix"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="AZ"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    placeholder="85001"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial Details
              </CardTitle>
              <CardDescription>Pricing and financial information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="askingPrice">Asking Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="askingPrice"
                      type="number"
                      placeholder="50000"
                      className="pl-7"
                      value={formData.askingPrice}
                      onChange={(e) => handleChange("askingPrice", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetOffer">Target Offer</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="targetOffer"
                      type="number"
                      placeholder="35000"
                      className="pl-7"
                      value={formData.targetOffer}
                      onChange={(e) => handleChange("targetOffer", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="estimatedValue"
                      type="number"
                      placeholder="45000"
                      className="pl-7"
                      value={formData.estimatedValue}
                      onChange={(e) => handleChange("estimatedValue", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owedAmount">Amount Owed</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="owedAmount"
                      type="number"
                      placeholder="0"
                      className="pl-7"
                      value={formData.owedAmount}
                      onChange={(e) => handleChange("owedAmount", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotRent">Monthly Lot Rent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="lotRent"
                    type="number"
                    placeholder="500"
                    className="pl-7"
                    value={formData.lotRent}
                    onChange={(e) => handleChange("lotRent", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Property Details
              </CardTitle>
              <CardDescription>Mobile home specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeType">Home Type</Label>
                  <Select value={formData.homeType} onValueChange={(v) => handleChange("homeType", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Wide</SelectItem>
                      <SelectItem value="double">Double Wide</SelectItem>
                      <SelectItem value="triple">Triple Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    placeholder="1995"
                    min={1950}
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={(e) => handleChange("yearBuilt", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="widthFt">Width (ft)</Label>
                  <Input
                    id="widthFt"
                    type="number"
                    placeholder="14"
                    value={formData.widthFt}
                    onChange={(e) => handleChange("widthFt", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lengthFt">Length (ft)</Label>
                  <Input
                    id="lengthFt"
                    type="number"
                    placeholder="70"
                    value={formData.lengthFt}
                    onChange={(e) => handleChange("lengthFt", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition (1-5)</Label>
                <Select value={formData.condition} onValueChange={(v) => handleChange("condition", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Park Owned</Label>
                  <p className="text-xs text-muted-foreground">Is this home on rented lot?</p>
                </div>
                <Switch
                  checked={formData.parkOwned}
                  onCheckedChange={(checked) => handleChange("parkOwned", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Lead Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.status} onValueChange={(v) => handleChange("status", v as LeadStatus)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="offer_made">Offer Made</SelectItem>
                <SelectItem value="under_contract">Under Contract</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional information about this lead</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any relevant notes about the property or seller..."
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link to={`/seller-leads/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateLead.isPending || !formData.name.trim() || !formData.address.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {updateLead.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
