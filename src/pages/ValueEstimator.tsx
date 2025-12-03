import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, TrendingUp, Home, Sparkles } from "lucide-react";

export default function ValueEstimator() {
  const [formData, setFormData] = useState({
    homeType: "",
    yearBuilt: "",
    condition: "",
    length: "",
    width: "",
    lotRent: "",
    location: "",
  });

  const [estimate, setEstimate] = useState<{
    low: number;
    mid: number;
    high: number;
    targetOffer: number;
  } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setEstimate(null);
  };

  const calculateEstimate = () => {
    // Simple estimation logic (in real app, this would be more sophisticated or AI-powered)
    let baseValue = 30000;

    // Home type multiplier
    if (formData.homeType === "double") baseValue *= 1.5;
    if (formData.homeType === "triple") baseValue *= 2;

    // Age adjustment
    const year = parseInt(formData.yearBuilt) || 1990;
    const age = 2024 - year;
    baseValue -= age * 300;

    // Condition adjustment
    const condition = parseInt(formData.condition) || 3;
    baseValue *= 0.7 + condition * 0.1;

    // Size adjustment
    const sqft = (parseInt(formData.length) || 56) * (parseInt(formData.width) || 14);
    baseValue += sqft * 15;

    // Ensure minimum value
    baseValue = Math.max(baseValue, 15000);

    const low = Math.round(baseValue * 0.85);
    const mid = Math.round(baseValue);
    const high = Math.round(baseValue * 1.15);
    const targetOffer = Math.round(baseValue * 0.7);

    setEstimate({ low, mid, high, targetOffer });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Property Value Estimator
          </h1>
          <p className="text-muted-foreground mt-2">
            Get a quick estimate for mobile home values based on key property characteristics
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Property Details
              </CardTitle>
              <CardDescription>Enter the property information to get an estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Home Type</Label>
                  <Select value={formData.homeType} onValueChange={(v) => handleChange("homeType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Wide</SelectItem>
                      <SelectItem value="double">Double Wide</SelectItem>
                      <SelectItem value="triple">Triple Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year Built</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1998"
                    value={formData.yearBuilt}
                    onChange={(e) => handleChange("yearBuilt", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condition (1-5)</Label>
                <Select value={formData.condition} onValueChange={(v) => handleChange("condition", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rate the condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor (Major repairs needed)</SelectItem>
                    <SelectItem value="2">2 - Fair (Some repairs needed)</SelectItem>
                    <SelectItem value="3">3 - Good (Minor cosmetic issues)</SelectItem>
                    <SelectItem value="4">4 - Very Good (Move-in ready)</SelectItem>
                    <SelectItem value="5">5 - Excellent (Like new)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Length (ft)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 56"
                    value={formData.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (ft)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 28"
                    value={formData.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Lot Rent (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="e.g., 450"
                    className="pl-7"
                    value={formData.lotRent}
                    onChange={(e) => handleChange("lotRent", e.target.value)}
                  />
                </div>
              </div>

              <Button variant="gradient" className="w-full" onClick={calculateEstimate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Calculate Estimate
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {estimate ? (
              <>
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Estimated Market Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{formatCurrency(estimate.mid)}</p>
                      <p className="text-muted-foreground mt-2">
                        Range: {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-secondary/50 bg-secondary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                      Suggested Target Offer
                    </CardTitle>
                    <CardDescription>Based on typical investor margins</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-secondary">{formatCurrency(estimate.targetOffer)}</p>
                      <p className="text-muted-foreground mt-2">
                        ~70% of estimated value
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Potential Profit Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">If sold at low estimate</span>
                      <span className="font-medium">{formatCurrency(estimate.low - estimate.targetOffer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">If sold at mid estimate</span>
                      <span className="font-medium text-primary">{formatCurrency(estimate.mid - estimate.targetOffer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">If sold at high estimate</span>
                      <span className="font-medium text-status-closed">{formatCurrency(estimate.high - estimate.targetOffer)}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Enter property details and click calculate to see the estimated value
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          * This is an estimate based on general market factors. Actual values may vary based on specific location, 
          market conditions, and detailed property inspection. Always conduct thorough due diligence before making offers.
        </p>
      </div>
    </DashboardLayout>
  );
}
