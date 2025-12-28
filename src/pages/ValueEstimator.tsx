import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calculator, DollarSign, Home, TrendingUp, ArrowLeft } from "lucide-react";

interface PropertyData {
  homeType: string;
  yearBuilt: number | null;
  condition: number | null;
  length: number | null;
  width: number | null;
  parkOwned: boolean;
  lotRent: number | null;
}

const conditionLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

// Base values per square foot by home type
const BASE_PSF = {
  single: 35,
  double: 45,
  triple: 50,
};

// Condition multipliers
const CONDITION_MULTIPLIER: Record<number, number> = {
  1: 0.6,
  2: 0.75,
  3: 0.9,
  4: 1.0,
  5: 1.15,
};

// Age depreciation (newer = higher value)
function getAgeMultiplier(yearBuilt: number | null): number {
  if (!yearBuilt) return 0.85;
  const age = new Date().getFullYear() - yearBuilt;
  if (age <= 5) return 1.1;
  if (age <= 10) return 1.0;
  if (age <= 20) return 0.9;
  if (age <= 30) return 0.75;
  return 0.6;
}

function calculateEstimatedValue(data: PropertyData): number {
  const sqft = (data.length || 60) * (data.width || 14);
  const basePsf = BASE_PSF[data.homeType as keyof typeof BASE_PSF] || BASE_PSF.single;
  const conditionMult = CONDITION_MULTIPLIER[data.condition || 3] || 0.9;
  const ageMult = getAgeMultiplier(data.yearBuilt);
  
  // Park owned land typically reduces value (no land equity)
  const parkMult = data.parkOwned ? 0.85 : 1.0;
  
  const value = sqft * basePsf * conditionMult * ageMult * parkMult;
  return Math.round(value / 100) * 100; // Round to nearest $100
}

export default function ValueEstimator() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");
  
  const [data, setData] = useState<PropertyData>({
    homeType: searchParams.get("homeType") || "single",
    yearBuilt: searchParams.get("yearBuilt") ? parseInt(searchParams.get("yearBuilt")!) : null,
    condition: searchParams.get("condition") ? parseInt(searchParams.get("condition")!) : null,
    length: searchParams.get("length") ? parseInt(searchParams.get("length")!) : null,
    width: searchParams.get("width") ? parseInt(searchParams.get("width")!) : null,
    parkOwned: searchParams.get("parkOwned") === "true",
    lotRent: searchParams.get("lotRent") ? parseInt(searchParams.get("lotRent")!) : null,
  });

  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Auto-calculate if coming from a lead with data
  useEffect(() => {
    if (leadId && (data.length || data.width || data.yearBuilt || data.condition)) {
      handleCalculate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof PropertyData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setHasCalculated(false);
  };

  const handleCalculate = () => {
    const value = calculateEstimatedValue(data);
    setEstimatedValue(value);
    setHasCalculated(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const sqft = (data.length || 0) * (data.width || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {leadId && (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/seller-leads/${leadId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Value Estimator</h1>
            <p className="text-muted-foreground">Estimate mobile home values based on property details</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
              <CardDescription>Enter property information to calculate estimated value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="homeType">Home Type</Label>
                  <Select value={data.homeType} onValueChange={(value) => handleChange("homeType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select home type" />
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
                    value={data.yearBuilt || ""}
                    onChange={(e) => handleChange("yearBuilt", parseInt(e.target.value) || null)}
                    placeholder="2010"
                    min={1950}
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={data.condition?.toString() || ""} 
                  onValueChange={(value) => handleChange("condition", parseInt(value))}
                >
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={data.length || ""}
                    onChange={(e) => handleChange("length", parseInt(e.target.value) || null)}
                    placeholder="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={data.width || ""}
                    onChange={(e) => handleChange("width", parseInt(e.target.value) || null)}
                    placeholder="14"
                  />
                </div>
              </div>

              {sqft > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total area: <span className="font-medium">{sqft.toLocaleString()} sq ft</span>
                </p>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="parkOwned">Park Owned Land</Label>
                  <p className="text-sm text-muted-foreground">
                    Is the home on park-owned land?
                  </p>
                </div>
                <Switch
                  id="parkOwned"
                  checked={data.parkOwned}
                  onCheckedChange={(checked) => handleChange("parkOwned", checked)}
                />
              </div>

              {data.parkOwned && (
                <div className="space-y-2">
                  <Label htmlFor="lotRent">Monthly Lot Rent ($)</Label>
                  <Input
                    id="lotRent"
                    type="number"
                    value={data.lotRent || ""}
                    onChange={(e) => handleChange("lotRent", parseInt(e.target.value) || null)}
                    placeholder="500"
                  />
                </div>
              )}

              <Button onClick={handleCalculate} className="w-full" size="lg">
                <Calculator className="mr-2 h-5 w-5" />
                Calculate Estimated Value
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            <Card className={hasCalculated ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estimated Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasCalculated && estimatedValue !== null ? (
                  <div className="text-center py-6">
                    <p className="text-5xl font-bold text-primary mb-2">
                      {formatCurrency(estimatedValue)}
                    </p>
                    <p className="text-muted-foreground">Based on property characteristics</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter property details and click calculate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasCalculated && estimatedValue !== null && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Value Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Low</p>
                        <p className="text-xl font-semibold text-destructive">
                          {formatCurrency(Math.round(estimatedValue * 0.85))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Mid</p>
                        <p className="text-xl font-semibold text-primary">
                          {formatCurrency(estimatedValue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">High</p>
                        <p className="text-xl font-semibold text-green-600">
                          {formatCurrency(Math.round(estimatedValue * 1.15))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Calculation Factors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Home Type</span>
                      <span className="font-medium capitalize">{data.homeType} Wide</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Square Footage</span>
                      <span className="font-medium">{sqft.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year Built</span>
                      <span className="font-medium">{data.yearBuilt || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition</span>
                      <span className="font-medium">
                        {data.condition ? conditionLabels[data.condition] : "Average"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Land Type</span>
                      <span className="font-medium">{data.parkOwned ? "Park Owned" : "Private Land"}</span>
                    </div>
                    {data.parkOwned && data.lotRent && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lot Rent</span>
                        <span className="font-medium">{formatCurrency(data.lotRent)}/mo</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {leadId && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/seller-leads/${leadId}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Lead
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
