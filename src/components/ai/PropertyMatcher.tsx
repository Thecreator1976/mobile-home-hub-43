import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSellerLeads, SellerLead, HomeType } from "@/hooks/useSellerLeads";
import { Buyer } from "@/hooks/useBuyers";
import { Home, MapPin, DollarSign, Star, MessageSquare, Sparkles, Phone, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface PropertyMatch {
  lead: SellerLead;
  matchScore: number;
  reasons: string[];
}

interface PropertyMatcherProps {
  buyer: Buyer;
  onMatchesFound?: (matches: PropertyMatch[]) => void;
}

export default function PropertyMatcher({ buyer, onMatchesFound }: PropertyMatcherProps) {
  const { toast } = useToast();
  const { leads, isLoading: leadsLoading } = useSellerLeads();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PropertyMatch | null>(null);

  const [filters, setFilters] = useState({
    minPrice: buyer.min_price || 0,
    maxPrice: buyer.max_price || 200000,
    homeTypes: buyer.home_types || [],
    locations: buyer.locations || [],
  });

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);

  const calculateMatches = () => {
    setLoading(true);

    try {
      // Filter only active leads
      const activeLeads = leads.filter((lead) =>
        ["new", "contacted", "offer_made"].includes(lead.status)
      );

      const matchResults: PropertyMatch[] = activeLeads
        .map((lead) => {
          let score = 0;
          const reasons: string[] = [];

          // Price match (40% weight)
          const price = lead.asking_price;
          if (price >= filters.minPrice && price <= filters.maxPrice) {
            score += 40;
            reasons.push("Price within budget");
          } else if (price <= filters.maxPrice * 1.2) {
            score += 20;
            reasons.push("Price slightly above budget");
          }

          // Home type match (30% weight)
          if (filters.homeTypes.length === 0 || filters.homeTypes.includes(lead.home_type)) {
            score += 30;
            reasons.push("Home type matches preference");
          }

          // Location match (20% weight)
          const leadLocation = `${lead.city || ""}, ${lead.state || ""}`.toLowerCase();
          if (
            filters.locations.length === 0 ||
            filters.locations.some((loc) => leadLocation.includes(loc.toLowerCase()))
          ) {
            score += 20;
            reasons.push("Location matches preference");
          }

          // Condition bonus (10% weight)
          if (lead.condition && lead.condition >= 4) {
            score += 10;
            reasons.push("Excellent condition");
          }

          return {
            lead,
            matchScore: Math.min(100, score),
            reasons,
          };
        })
        .filter((match) => match.matchScore >= 50)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      setMatches(matchResults);

      if (onMatchesFound) {
        onMatchesFound(matchResults);
      }

      if (matchResults.length === 0) {
        toast({
          title: "No matches found",
          description: "Try adjusting the search criteria.",
        });
      } else {
        toast({
          title: "Matches found",
          description: `Found ${matchResults.length} matching properties.`,
        });
      }
    } catch (error) {
      console.error("Error finding matches:", error);
      toast({
        title: "Error",
        description: "Failed to find matching properties.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSmsMessage = (match: PropertyMatch) => {
    const lead = match.lead;
    return `Hi ${buyer.name},

I found a mobile home that matches what you're looking for:

🏠 ${lead.address}${lead.city ? `, ${lead.city}` : ""}
💰 Price: ${formatCurrency(lead.asking_price)}
📐 ${lead.home_type?.charAt(0).toUpperCase()}${lead.home_type?.slice(1)} wide${lead.length_ft && lead.width_ft ? ` • ${lead.length_ft}x${lead.width_ft}` : ""}
⭐ Condition: ${lead.condition || "N/A"}/5

Match score: ${match.matchScore}%

Would you like to schedule a viewing?

Best regards,
Your Mobile Home Agent`;
  };

  const handleSendSms = () => {
    if (!buyer.phone || !selectedMatch) return;

    const phoneNumber = buyer.phone.replace(/\D/g, "");
    const message = encodeURIComponent(generateSmsMessage(selectedMatch));
    const smsLink = `sms:${phoneNumber}?body=${message}`;
    window.open(smsLink, "_blank");

    toast({
      title: "SMS Ready",
      description: "SMS message prepared for sending.",
    });

    setShowSmsDialog(false);
  };

  const getMatchBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Property Matcher
          </CardTitle>
          <CardDescription>
            Find matching properties for {buyer.name} based on their criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Min"
                    className="pl-9"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Max"
                    className="pl-9"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: parseInt(e.target.value) || 200000,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Home Type</Label>
              <Select
                value={filters.homeTypes[0] || "any"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    homeTypes: value === "any" ? [] : [value as HomeType],
                  }))
                }
              >
                <SelectTrigger>
                  <Home className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  <SelectItem value="single">Single Wide</SelectItem>
                  <SelectItem value="double">Double Wide</SelectItem>
                  <SelectItem value="triple">Triple Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Find Matches Button */}
          <div className="flex justify-center">
            <Button
              onClick={calculateMatches}
              disabled={loading || leadsLoading}
              size="lg"
              className="px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Matching Properties
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Properties</CardTitle>
            <CardDescription>
              {matches.length} propert{matches.length !== 1 ? "ies" : "y"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match) => (
                <Card key={match.lead.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{match.lead.address}</h4>
                          <Badge className={getMatchBadgeColor(match.matchScore)}>
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {match.lead.city}, {match.lead.state}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(match.lead.asking_price)}
                          </div>
                          <div className="flex items-center">
                            <Home className="h-3 w-3 mr-1" />
                            <span className="capitalize">{match.lead.home_type}</span>
                          </div>
                          {match.lead.condition && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              Condition: {match.lead.condition}/5
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {match.reasons.slice(0, 3).join(" • ")}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/seller-leads/${match.lead.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        {buyer.phone && (
                          <Dialog open={showSmsDialog && selectedMatch?.lead.id === match.lead.id} onOpenChange={(open) => {
                            setShowSmsDialog(open);
                            if (open) setSelectedMatch(match);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                SMS
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Property Match via SMS</DialogTitle>
                                <DialogDescription>
                                  Send this property match to {buyer.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="border rounded-lg p-3 bg-muted/50 max-h-60 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap text-sm font-mono">
                                    {generateSmsMessage(match)}
                                  </pre>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="mr-2 h-4 w-4" />
                                  Will be sent to: {buyer.phone}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSmsDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSendSms}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Send SMS
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
