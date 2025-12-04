import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useBuyers, Buyer } from "@/hooks/useBuyers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyMatcher from "@/components/ai/PropertyMatcher";
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, Home, User, Edit, Trash2, CreditCard, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
  hot: { label: "Hot Lead", color: "bg-red-100 text-red-800" },
};

export default function BuyerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { deleteBuyer } = useBuyers();
  const defaultTab = searchParams.get("tab") || "overview";

  const { data: buyer, isLoading, error } = useQuery({
    queryKey: ["buyer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Buyer;
    },
    enabled: !!id,
  });

  const formatCurrency = (value: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

  const handleDelete = async () => {
    if (!buyer) return;
    await deleteBuyer.mutateAsync(buyer.id);
    navigate("/buyers");
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

  if (error || !buyer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load buyer details.</p>
          <Button variant="link" onClick={() => navigate("/buyers")}>
            Back to Buyers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = buyer.status || "active";
  const statusInfo = statusConfig[status] || statusConfig.active;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/buyers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{buyer.name}</h1>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Added {format(new Date(buyer.created_at), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/buyers/${buyer.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {buyer.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex flex-wrap gap-3">
          {buyer.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${buyer.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                {buyer.phone}
              </a>
            </Button>
          )}
          {buyer.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${buyer.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                {buyer.email}
              </a>
            </Button>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="criteria">Criteria</TabsTrigger>
            <TabsTrigger value="matches">
              <Sparkles className="h-4 w-4 mr-1" />
              Property Matches
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Budget Range</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">
                    {formatCurrency(buyer.min_price)} - {formatCurrency(buyer.max_price)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Home Types</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {buyer.home_types?.length ? (
                      buyer.home_types.map((type) => (
                        <Badge key={type} variant="secondary" className="capitalize">
                          {type}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Any</span>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Credit Score</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{buyer.credit_score || "N/A"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {buyer.locations?.length ? (
                      buyer.locations.map((loc) => (
                        <Badge key={loc} variant="outline">
                          {loc}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Any</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {buyer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{buyer.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Criteria Tab */}
          <TabsContent value="criteria" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Preferences</CardTitle>
                <CardDescription>Property requirements and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Price Range</h4>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(buyer.min_price)} - {formatCurrency(buyer.max_price)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Credit Score</h4>
                    <p className="text-2xl font-bold">{buyer.credit_score || "Not provided"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Preferred Home Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {buyer.home_types?.length ? (
                      buyer.home_types.map((type) => (
                        <Badge key={type} variant="secondary" className="capitalize text-base px-3 py-1">
                          <Home className="h-4 w-4 mr-1" />
                          {type} wide
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Any home type</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Preferred Locations</h4>
                  <div className="flex flex-wrap gap-2">
                    {buyer.locations?.length ? (
                      buyer.locations.map((location) => (
                        <Badge key={location} variant="outline" className="text-base px-3 py-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {location}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Any location</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Matches Tab */}
          <TabsContent value="matches">
            <PropertyMatcher buyer={buyer} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
