import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBuyers, Buyer } from "@/hooks/useBuyers";
import { SellerLead } from "@/hooks/useSellerLeads";
import { supabase } from "@/integrations/supabase/client";
import { Home, MapPin, DollarSign, Star, MessageSquare, Sparkles, Phone, ExternalLink, Loader2, Brain } from "lucide-react";
import { Link } from "react-router-dom";

interface AIMatch {
  buyerId: string;
  buyerName: string;
  matchScore: number;
  reasons: string[];
  recommendation: string;
}

interface SellerBuyerMatcherProps {
  lead: SellerLead;
  onMatchesFound?: (matches: AIMatch[]) => void;
}

export default function SellerBuyerMatcher({ lead, onMatchesFound }: SellerBuyerMatcherProps) {
  const { toast } = useToast();
  const { buyers, isLoading: buyersLoading } = useBuyers();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<AIMatch[]>([]);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);

  const findAIMatches = async () => {
    if (!buyers.length) {
      toast({
        title: "No buyers available",
        description: "Add some buyers first to find matches.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-match", {
        body: {
          sellerLead: {
            id: lead.id,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            asking_price: lead.asking_price,
            home_type: lead.home_type,
            condition: lead.condition,
            year_built: lead.year_built,
            length_ft: lead.length_ft,
            width_ft: lead.width_ft,
            notes: lead.notes,
          },
          buyers: buyers.filter(b => b.status === "active").map(b => ({
            id: b.id,
            name: b.name,
            min_price: b.min_price,
            max_price: b.max_price,
            home_types: b.home_types,
            locations: b.locations,
            credit_score: b.credit_score,
            notes: b.notes,
          })),
        },
      });

      if (error) throw error;

      const matchResults = data.matches || [];
      setMatches(matchResults);

      if (onMatchesFound) {
        onMatchesFound(matchResults);
      }

      if (matchResults.length === 0) {
        toast({
          title: "No matches found",
          description: "AI couldn't find suitable buyers for this property.",
        });
      } else {
        toast({
          title: "AI Matches Found",
          description: `Found ${matchResults.length} potential buyer${matchResults.length !== 1 ? "s" : ""}.`,
        });
      }
    } catch (error) {
      console.error("Error finding AI matches:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to find matches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBuyerById = (id: string): Buyer | undefined => 
    buyers.find(b => b.id === id);

  const generateSmsMessage = (buyer: Buyer, match: AIMatch) => {
    return `Hi ${buyer.name},

I have a mobile home that matches what you're looking for!

🏠 ${lead.address}${lead.city ? `, ${lead.city}` : ""}
💰 Price: ${formatCurrency(lead.asking_price)}
📐 ${lead.home_type?.charAt(0).toUpperCase()}${lead.home_type?.slice(1)} wide${lead.length_ft && lead.width_ft ? ` • ${lead.length_ft}x${lead.width_ft}` : ""}
⭐ Condition: ${lead.condition || "N/A"}/5

AI Match Score: ${match.matchScore}%
${match.reasons.slice(0, 2).join(" • ")}

Would you like to schedule a viewing?

Best regards,
Your Mobile Home Agent`;
  };

  const handleSendSms = () => {
    if (!selectedBuyer?.phone) return;

    const match = matches.find(m => m.buyerId === selectedBuyer.id);
    if (!match) return;

    const phoneNumber = selectedBuyer.phone.replace(/\D/g, "");
    const message = encodeURIComponent(generateSmsMessage(selectedBuyer, match));
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
            <Brain className="h-5 w-5 text-primary" />
            AI Buyer Matcher
          </CardTitle>
          <CardDescription>
            Find the best matching buyers for {lead.address} using AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Property:</span>
              <p className="font-medium">{lead.address}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Asking Price:</span>
              <p className="font-medium">{formatCurrency(lead.asking_price)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium capitalize">{lead.home_type} wide</p>
            </div>
            <div>
              <span className="text-muted-foreground">Active Buyers:</span>
              <p className="font-medium">{buyers.filter(b => b.status === "active").length}</p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={findAIMatches}
              disabled={loading || buyersLoading}
              size="lg"
              className="px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Matching Buyers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Matched Buyers</CardTitle>
            <CardDescription>
              {matches.length} potential buyer{matches.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match) => {
                const buyer = getBuyerById(match.buyerId);
                if (!buyer) return null;

                return (
                  <Card key={match.buyerId} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{match.buyerName}</h4>
                            <Badge className={getMatchBadgeColor(match.matchScore)}>
                              {match.matchScore}% Match
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {formatCurrency(buyer.min_price)} - {formatCurrency(buyer.max_price)}
                            </div>
                            {buyer.home_types && buyer.home_types.length > 0 && (
                              <div className="flex items-center">
                                <Home className="h-3 w-3 mr-1" />
                                {buyer.home_types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}
                              </div>
                            )}
                            {buyer.credit_score && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                Credit: {buyer.credit_score}
                              </div>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Why: </span>
                            {match.reasons.slice(0, 3).join(" • ")}
                          </div>
                          {match.recommendation && (
                            <p className="text-sm text-primary italic">
                              {match.recommendation}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/buyers/${match.buyerId}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {buyer.phone && (
                            <Dialog open={showSmsDialog && selectedBuyer?.id === buyer.id} onOpenChange={(open) => {
                              setShowSmsDialog(open);
                              if (open) setSelectedBuyer(buyer);
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
                                    Send this property to {buyer.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="border rounded-lg p-3 bg-muted/50 max-h-60 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm font-mono">
                                      {generateSmsMessage(buyer, match)}
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
