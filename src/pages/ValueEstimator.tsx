import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, DollarSign, Home, TrendingUp, ArrowLeft, ChevronDown, Info } from "lucide-react";

interface PropertyData {
  decade: "1980s" | "1990s";
  condition: number | null;
  length: number | null;
  width: number | null;
  marketAdjustment: number;
  parkOwned: boolean;
  lotRent: number | null;
}

// Price per Sq Ft Reference Table (SC Base)
// Returns [min, max] range
const PRICE_PER_SQFT: Record<string, Record<number, [number, number]>> = {
  "1980s": {
    1: [1.5, 2],      // Not livable, needs full remodel
    2: [2.5, 3],      // Hardly livable, needs major repairs
    3: [4, 4.5],      // Livable, needs minor updates/repairs
    4: [5.5, 6],      // Livable, needs only minor updates
    5: [6.5, 7],      // Livable, fully remodeled
  },
  "1990s": {
    1: [2, 2.5],      // Not livable, needs full remodel
    2: [3, 3.5],      // Hardly livable, needs major repairs
    3: [4.5, 5],      // Livable, needs minor updates/repairs
    4: [6, 6.5],      // Livable, needs only minor updates
    5: [7.5, 8],      // Livable, fully remodeled
  },
};

const CONDITION_DESCRIPTIONS: Record<number, string> = {
  1: "Not livable, needs full remodel",
  2: "Hardly livable, needs major repairs",
  3: "Livable, needs minor updates/repairs",
  4: "Livable, needs only minor updates",
  5: "Livable, fully remodeled",
};

function getPricePerSqFt(decade: string, condition: number): number {
  const range = PRICE_PER_SQFT[decade]?.[condition];
  if (!range) return 4; // default fallback
  // Use midpoint of range
  return (range[0] + range[1]) / 2;
}

interface CalculationBreakdown {
  sqft: number;
  pricePerSqFt: number;
  basePrice: number;
  locationAdjusted: number;
  finalPrice: number;
  movingFactor: number;
  wholesaleDiscount: number;
  marketAdjustment: number;
}

function calculateWholesalePrice(data: PropertyData): CalculationBreakdown | null {
  const sqft = (data.length || 0) * (data.width || 0);
  if (sqft === 0 || !data.condition) return null;
  
  const pricePerSqFt = getPricePerSqFt(data.decade, data.condition);
  const movingFactor = 2;
  const wholesaleDiscount = 0.92;
  const marketAdjustment = data.marketAdjustment;
  
  // Formula: [Sq Ft × 2 × Price per Sq Ft] × (1 + Market%/100) × 0.92
  const basePrice = sqft * movingFactor * pricePerSqFt;
  const locationAdjusted = basePrice * (1 + marketAdjustment / 100);
  const finalPrice = Math.round(locationAdjusted * wholesaleDiscount);
  
  return {
    sqft,
    pricePerSqFt,
    basePrice,
    locationAdjusted,
    finalPrice,
    movingFactor,
    wholesaleDiscount,
    marketAdjustment,
  };
}

export default function ValueEstimator() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");
  
  // Determine decade from yearBuilt param
  const getDecadeFromYear = (year: string | null): "1980s" | "1990s" => {
    if (!year) return "1990s";
    const y = parseInt(year);
    if (y >= 1980 && y < 1990) return "1980s";
    return "1990s";
  };
  
  const [data, setData] = useState<PropertyData>({
    decade: getDecadeFromYear(searchParams.get("yearBuilt")),
    condition: searchParams.get("condition") ? parseInt(searchParams.get("condition")!) : null,
    length: searchParams.get("length") ? parseInt(searchParams.get("length")!) : null,
    width: searchParams.get("width") ? parseInt(searchParams.get("width")!) : null,
    marketAdjustment: 0, // SC base = 0%
    parkOwned: searchParams.get("parkOwned") === "true",
    lotRent: searchParams.get("lotRent") ? parseInt(searchParams.get("lotRent")!) : null,
  });

  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Auto-calculate if coming from a lead with data
  useEffect(() => {
    if (leadId && (data.length || data.width || data.condition)) {
      handleCalculate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof PropertyData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setHasCalculated(false);
  };

  const handleCalculate = () => {
    const result = calculateWholesalePrice(data);
    setBreakdown(result);
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
            <h1 className="text-3xl font-bold tracking-tight">Wholesale Price Calculator</h1>
            <p className="text-muted-foreground">Calculate wholesale prices using the standardized formula</p>
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
              <CardDescription>Enter property information to calculate wholesale price</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="decade">Decade Built</Label>
                  <Select value={data.decade} onValueChange={(value: "1980s" | "1990s") => handleChange("decade", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1980s">1980s</SelectItem>
                      <SelectItem value="1990s">1990s</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="1">1 - Not livable, full remodel</SelectItem>
                      <SelectItem value="2">2 - Hardly livable, major repairs</SelectItem>
                      <SelectItem value="3">3 - Livable, minor updates needed</SelectItem>
                      <SelectItem value="4">4 - Livable, only minor updates</SelectItem>
                      <SelectItem value="5">5 - Fully remodeled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="marketAdjustment" className="flex items-center gap-2">
                  Market % Difference from SC
                  <span className="text-xs text-muted-foreground">(SC = 0% base)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="marketAdjustment"
                    type="number"
                    value={data.marketAdjustment}
                    onChange={(e) => handleChange("marketAdjustment", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Positive = market higher than SC, Negative = market lower than SC
                </p>
              </div>

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
                Calculate Wholesale Price
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            <Card className={hasCalculated ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Wholesale Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasCalculated && breakdown ? (
                  <div className="text-center py-6">
                    <p className="text-5xl font-bold text-primary mb-2">
                      {formatCurrency(breakdown.finalPrice)}
                    </p>
                    <p className="text-muted-foreground">With 8% wholesale discount applied</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter property details and click calculate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasCalculated && breakdown && (
              <>
                {/* Calculation Breakdown */}
                <Card>
                  <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Calculation Breakdown
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-3 text-sm border-t pt-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Square Footage</span>
                            <span className="font-medium">{breakdown.sqft.toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price per Sq Ft ({data.decade}, Condition {data.condition})</span>
                            <span className="font-medium">${breakdown.pricePerSqFt.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Moving Cost Factor</span>
                            <span className="font-medium">×2</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="text-muted-foreground">Base Price</span>
                            <span className="font-medium">{formatCurrency(breakdown.basePrice)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground italic">
                              {breakdown.sqft} × 2 × ${breakdown.pricePerSqFt.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Market Adjustment ({breakdown.marketAdjustment >= 0 ? "+" : ""}{breakdown.marketAdjustment}%)</span>
                            <span className="font-medium">×{(1 + breakdown.marketAdjustment / 100).toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="text-muted-foreground">Location Adjusted</span>
                            <span className="font-medium">{formatCurrency(breakdown.locationAdjusted)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Wholesale Discount (8%)</span>
                            <span className="font-medium">×0.92</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between text-base">
                            <span className="font-semibold">Final Wholesale Price</span>
                            <span className="font-bold text-primary">{formatCurrency(breakdown.finalPrice)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Quick Reference */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Price per Sq Ft Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-semibold mb-2">1980s Homes</p>
                        <div className="space-y-1">
                          {Object.entries(PRICE_PER_SQFT["1980s"]).map(([cond, range]) => (
                            <div key={cond} className={`flex justify-between ${data.decade === "1980s" && data.condition === parseInt(cond) ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              <span>Condition {cond}</span>
                              <span>${range[0]} - ${range[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">1990s Homes</p>
                        <div className="space-y-1">
                          {Object.entries(PRICE_PER_SQFT["1990s"]).map(([cond, range]) => (
                            <div key={cond} className={`flex justify-between ${data.decade === "1990s" && data.condition === parseInt(cond) ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              <span>Condition {cond}</span>
                              <span>${range[0]} - ${range[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Property Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Property Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Decade</span>
                      <span className="font-medium">{data.decade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition</span>
                      <span className="font-medium">
                        {data.condition ? CONDITION_DESCRIPTIONS[data.condition] : "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Square Footage</span>
                      <span className="font-medium">{sqft.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market vs SC</span>
                      <span className="font-medium">{data.marketAdjustment >= 0 ? "+" : ""}{data.marketAdjustment}%</span>
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

        {/* Formula Reference Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Formula Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-background px-3 py-2 rounded-md block">
              Final Price = [Sq Ft × 2 × Price per Sq Ft] × (1 + Market%/100) × 0.92
            </code>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>×2</strong> = Moving cost factor | <strong>×0.92</strong> = 8% wholesale discount | <strong>SC = 0%</strong> base market
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
