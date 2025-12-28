import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, User, DollarSign, Home, MapPin } from "lucide-react";
import { useBuyers } from "@/hooks/useBuyers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HomeType } from "@/hooks/useSellerLeads";

export default function EditBuyer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateBuyer } = useBuyers();

  const { data: buyer, isLoading } = useQuery({
    queryKey: ["buyer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    minPrice: "",
    maxPrice: "",
    homeTypes: [] as HomeType[],
    locations: "",
    creditScore: "",
    notes: "",
    status: "active" as "active" | "inactive" | "closed",
  });

  useEffect(() => {
    if (buyer) {
      setFormData({
        name: buyer.name || "",
        phone: buyer.phone || "",
        email: buyer.email || "",
        minPrice: buyer.min_price?.toString() || "",
        maxPrice: buyer.max_price?.toString() || "",
        homeTypes: (buyer.home_types as HomeType[]) || [],
        locations: buyer.locations?.join(", ") || "",
        creditScore: buyer.credit_score?.toString() || "",
        notes: buyer.notes || "",
        status: (buyer.status as "active" | "inactive" | "closed") || "active",
      });
    }
  }, [buyer]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHomeTypeToggle = (type: HomeType) => {
    setFormData((prev) => ({
      ...prev,
      homeTypes: prev.homeTypes.includes(type)
        ? prev.homeTypes.filter((t) => t !== type)
        : [...prev.homeTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    updateBuyer.mutate(
      {
        id,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        min_price: formData.minPrice ? parseInt(formData.minPrice) : null,
        max_price: formData.maxPrice ? parseInt(formData.maxPrice) : null,
        home_types: formData.homeTypes.length > 0 ? formData.homeTypes : null,
        locations: formData.locations
          ? formData.locations.split(",").map((l) => l.trim()).filter(Boolean)
          : null,
        credit_score: formData.creditScore ? parseInt(formData.creditScore) : null,
        notes: formData.notes || null,
        status: formData.status,
      },
      {
        onSuccess: () => {
          navigate(`/buyers/${id}`);
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

  if (!buyer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Buyer not found</p>
          <Button asChild>
            <Link to="/buyers">Back to Buyers</Link>
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
            <Link to={`/buyers/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Edit Buyer</h1>
            <p className="text-muted-foreground">Update buyer information</p>
          </div>
          <Button type="submit" disabled={updateBuyer.isPending || !formData.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {updateBuyer.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription>Basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
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

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Budget
              </CardTitle>
              <CardDescription>Price range and financial info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Minimum Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="minPrice"
                      type="number"
                      placeholder="20000"
                      className="pl-7"
                      value={formData.minPrice}
                      onChange={(e) => handleChange("minPrice", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Maximum Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="50000"
                      className="pl-7"
                      value={formData.maxPrice}
                      onChange={(e) => handleChange("maxPrice", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  type="number"
                  placeholder="650"
                  min={300}
                  max={850}
                  value={formData.creditScore}
                  onChange={(e) => handleChange("creditScore", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Property Preferences
              </CardTitle>
              <CardDescription>Home types they're interested in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Home Types</Label>
                <div className="flex flex-wrap gap-4">
                  {(["single", "double", "triple"] as HomeType[]).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={formData.homeTypes.includes(type)}
                        onCheckedChange={() => handleHomeTypeToggle(type)}
                      />
                      <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                        {type} Wide
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Preferred Locations
              </CardTitle>
              <CardDescription>Areas they want to buy in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locations">Locations (comma-separated)</Label>
                <Input
                  id="locations"
                  placeholder="Phoenix, Scottsdale, Mesa"
                  value={formData.locations}
                  onChange={(e) => handleChange("locations", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any other important information</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="E.g., First-time buyer, needs financing help..."
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link to={`/buyers/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateBuyer.isPending || !formData.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {updateBuyer.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
