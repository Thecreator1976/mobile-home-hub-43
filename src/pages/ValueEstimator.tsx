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
import { Calculator, DollarSign, Home, TrendingUp, ArrowLeft, ChevronDown, Info, Tag } from "lucide-react";

type Decade = "1980s" | "1990s" | "2000s" | "2010s";

interface PropertyData {
  decade: Decade;
  condition: number | null;
  length: number | null;
  width: number | null;
  marketAdjustment: number;
  parkOwned: boolean;
  lotRent: number | null;
}

// Price per Sq Ft Reference Table (SC Base)
// Returns [min, max] range
const PRICE_PER_SQFT: Record<Decade, Record<number, [number, number]>> = {
  "1980s": {
    1: [1.5, 2],
    2: [2.5, 3],
    3: [4, 4.5],
    4: [5.5, 6],
    5: [6.5, 7],
  },
  "1990s": {
    1: [2, 2.5],
    2: [3, 3.5],
    3: [4.5, 5],
    4: [6, 6.5],
    5: [7.5, 8],
  },
  "2000s": {
    1: [4.5, 5],
    2: [5.5, 6],
    3: [7.5, 8],
    4: [9.5, 10],
    5: [11.5, 12],
  },
  "2010s": {
    1: [6.5, 7],
    2: [11.5, 12],
    3: [14.5, 15],
    4: [20.5, 21],
    5: [21.5, 22],
  },
};

const CONDITION_DESCRIPTIONS: Record<number, string> = {
  1: "Not livable, needs complete full remodel",
  2: "Hardly livable, needs major repairs and updates",
  3: "Livable/rentable, needs minor updates and repairs",
  4: "Livable/rentable, needs minor updates (paint/carpet), no repairs",
  5: "Livable/rentable, fully remodeled, no updates or repairs needed",
};

const CONDITION_SHORT: Record<number, string> = {
  1: "Not livable, full remodel",
  2: "Hardly livable, major repairs",
  3: "Livable, minor updates + repairs",
  4: "Livable, minor updates only",
  5: "Fully remodeled",
};

function getPricePerSqFt(decade: Decade, condition: number): number {
  const range = PRICE_PER_SQFT[decade]?.[condition];
  if (!range) return 4;
  return (range[0] + range[1]) / 2;
}

const WHOLESALE_FACTOR = 0.45;

interface CalculationBreakdown {
  sqft: number;
  pricePerSqFt: number;
  basePrice: number;
  retailPrice: number;
  adjustedRetail: number;
  wholesalePrice: number;
  marketAdjustment: number;
}

function calculatePrices(data: PropertyData): CalculationBreakdown | null {
  const sqft = (data.length || 0) * (data.width || 0);
  if (sqft === 0 || !data.condition) return null;

  const pricePerSqFt = getPricePerSqFt(data.decade, data.condition);
  const marketAdjustment = data.marketAdjustment;

  // Retail = Sq Ft × Midpoint × 2
  const basePrice = sqft * pricePerSqFt;
  const retailPrice = basePrice * 2;
  // Adjusted Retail = Retail × (1 + Market%/100)
  const adjustedRetail = Math.round(retailPrice * (1 + marketAdjustment / 100));
  // Wholesale = Adjusted Retail × 0.45
  const wholesalePrice = Math.round(adjustedRetail * WHOLESALE_FACTOR);

  return {
    sqft,
    pricePerSqFt,
    basePrice,
    retailPrice,
    adjustedRetail,
    wholesalePrice,
    marketAdjustment,
  };
}

export default function ValueEstimator() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");

  const getDecadeFromYear = (year: string | null): Decade => {
    if (!year) return "1990s";
    const y = parseInt(year);
    if (y >= 2010) return "2010s";
    if (y >= 2000) return "2000s";
    if (y >= 1990) return "1990s";
    if (y >= 1980) return "1980s";
    return "1980s";
  };

  const [data, setData] = useState<PropertyData>({
    decade: getDecadeFromYear(searchParams.get("yearBuilt")),
    condition: searchParams.get("condition") ? parseInt(searchParams.get("condition")!) : null,
    length: searchParams.get("length") ? parseInt(searchParams.get("length")!) : null,
    width: searchParams.get("width") ? parseInt(searchParams.get("width")!) : null,
    marketAdjustment: 0,
    parkOwned: searchParams.get("parkOwned") === "true",
    lotRent: searchParams.get("lotRent") ? parseInt(searchParams.get("lotRent")!) : null,
  });

  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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
    const result = calculatePrices(data);
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
            <h1 className="text-3xl font-bold tracking-tight">Property Value Estimator</h1>
            <p className="text-muted-foreground">Calculate retail listing and wholesale purchase prices</p>
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
              <CardDescription>Enter property information to estimate prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="decade">Decade Built</Label>
                  <Select value={data.decade} onValueChange={(value: Decade) => handleChange("decade", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1980s">1980s</SelectItem>
                      <SelectItem value="1990s">1990s</SelectItem>
                      <SelectItem value="2000s">2000s</SelectItem>
                      <SelectItem value="2010s">2010s</SelectItem>
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
                      <SelectItem value="1">⭐ 1 - {CONDITION_SHORT[1]}</SelectItem>
                      <SelectItem value="2">🟩 2 - {CONDITION_SHORT[2]}</SelectItem>
                      <SelectItem value="3">🟦 3 - {CONDITION_SHORT[3]}</SelectItem>
                      <SelectItem value="4">🟧 4 - {CONDITION_SHORT[4]}</SelectItem>
                      <SelectItem value="5">🟨 5 - {CONDITION_SHORT[5]}</SelectItem>
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
                Calculate Prices
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {/* Two price cards side by side */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className={hasCalculated && breakdown ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" />
                    Retail Listing Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasCalculated && breakdown ? (
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(breakdown.adjustedRetail)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Sq Ft × Midpoint × 2</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Enter details to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={hasCalculated && breakdown ? "border-green-500" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-4 w-4" />
                    Wholesale Purchase Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasCalculated && breakdown ? (
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(breakdown.wholesalePrice)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Retail × 0.45</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Enter details to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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
                          <div className="border-t pt-3 flex justify-between">
                            <span className="text-muted-foreground">Step 1: Sq Ft × Midpoint</span>
                            <span className="font-medium">{formatCurrency(breakdown.basePrice)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground italic">
                              {breakdown.sqft.toLocaleString()} × ${breakdown.pricePerSqFt.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="text-muted-foreground">Step 2: Base × 2 = Retail</span>
                            <span className="font-medium">{formatCurrency(breakdown.retailPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Step 3: Market Adjustment ({breakdown.marketAdjustment >= 0 ? "+" : ""}{breakdown.marketAdjustment}%)</span>
                            <span className="font-medium">×{(1 + breakdown.marketAdjustment / 100).toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="text-muted-foreground">Adjusted Retail</span>
                            <span className="font-medium text-primary">{formatCurrency(breakdown.adjustedRetail)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Step 4: Retail × 0.45 = Wholesale</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(breakdown.wholesalePrice)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Quick Reference - 2x2 grid for all 4 decades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Price per Sq Ft Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {(["1980s", "1990s", "2000s", "2010s"] as Decade[]).map((decade) => (
                        <div key={decade}>
                          <p className={`font-semibold mb-2 ${data.decade === decade ? "text-primary" : ""}`}>{decade} Homes</p>
                          <div className="space-y-1">
                            {Object.entries(PRICE_PER_SQFT[decade]).map(([cond, range]) => (
                              <div
                                key={cond}
                                className={`flex justify-between ${data.decade === decade && data.condition === parseInt(cond) ? "text-primary font-medium" : "text-muted-foreground"}`}
                              >
                                <span>Cond. {cond}</span>
                                <span>${range[0]} - ${range[1]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
          <CardContent className="space-y-2">
            <code className="text-sm bg-background px-3 py-2 rounded-md block">
              Retail Price = Sq Ft × Midpoint Price Per Sq Ft × 2 × (1 + Market%/100)
            </code>
            <code className="text-sm bg-background px-3 py-2 rounded-md block">
              Wholesale Price = Retail Price × 0.45
            </code>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>×2</strong> = Retail multiplier | <strong>×0.45</strong> = Wholesale factor | <strong>SC = 0%</strong> base market
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
