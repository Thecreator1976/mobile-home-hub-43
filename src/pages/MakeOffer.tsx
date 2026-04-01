import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSellerLead } from "@/hooks/useSellerLeads";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Loader2, Check, Send, Download, Edit, DollarSign, Calendar, User, Home, Sparkles, Info, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { SendToDocuSignButton } from "@/components/integrations/SendToDocuSignButton";
import { ContractTemplateSelector } from "@/components/contracts/ContractTemplateSelector";
import { ContractTemplate } from "@/hooks/useContractTemplates";

export default function MakeOffer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: lead, isLoading } = useSellerLead(id);
  const { createContract, isCreating } = useContracts();
  
  const [savedContractId, setSavedContractId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("offer");
  const [generating, setGenerating] = useState(false);
  const [contractContent, setContractContent] = useState("");
  const [contractType, setContractType] = useState<"purchase_agreement" | "option_agreement" | "assignment">("purchase_agreement");
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const [offerData, setOfferData] = useState({
    purchasePrice: 0,
    earnestMoney: 1000,
    closingDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    financing: "cash",
    inspectionPeriod: 10,
    specialTerms: "",
    buyerName: "",
    buyerAddress: "",
  });

  useEffect(() => {
    if (lead) {
      setOfferData((prev) => ({
        ...prev,
        purchasePrice: lead.target_offer || lead.asking_price * 0.7,
        earnestMoney: Math.round((lead.target_offer || lead.asking_price * 0.7) * 0.01),
      }));
    }
  }, [lead]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generateContract = async () => {
    if (!lead) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: {
          leadData: {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            zip: lead.zip,
            home_type: lead.home_type || "single",
            year_built: lead.year_built,
            asking_price: lead.asking_price,
            target_offer: offerData.purchasePrice,
            lot_rent: lead.lot_rent,
            condition: lead.condition,
            notes: lead.notes,
          },
          offerData: {
            purchasePrice: offerData.purchasePrice,
            earnestMoney: offerData.earnestMoney,
            closingDate: offerData.closingDate,
            financing: offerData.financing,
            inspectionPeriod: offerData.inspectionPeriod,
            specialTerms: offerData.specialTerms,
            buyerName: offerData.buyerName,
            buyerAddress: offerData.buyerAddress,
          },
          templateContent: selectedTemplate?.content || undefined,
          templateId: selectedTemplate?.id || undefined,
          customizationNotes: lead.notes || undefined,
          contractType,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setContractContent(data.contract);
      setActiveTab("review");

      // Auto-save contract to database
      try {
        const savedContract = await createContract({
          seller_lead_id: lead.id,
          template_id: selectedTemplate?.id || null,
          template_name: selectedTemplate?.name || `AI Generated (${contractType})`,
          content: data.contract,
          status: "draft",
          contract_type: contractType,
          offer_data: offerData,
        });
        setSavedContractId(savedContract.id);
      } catch (saveError) {
        console.error("Error saving contract:", saveError);
        // Continue even if save fails - user can still download
      }

      toast({
        title: "Contract Generated & Saved",
        description: selectedTemplate 
          ? `Contract generated using "${selectedTemplate.name}" template and saved.`
          : "AI has generated your contract from scratch and saved it.",
      });
    } catch (error: unknown) {
      console.error("Error generating contract:", error);
      const message = error instanceof Error ? error.message : "Failed to generate contract. Please try again.";
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadContract = () => {
    if (!contractContent || !lead) return;

    const blob = new Blob([contractContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contract_${lead.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Contract has been downloaded to your device.",
    });
  };

  const saveAndUpdateStatus = async () => {
    if (!lead) return;

    try {
      // Update lead status to offer_made
      const { error } = await supabase
        .from("seller_leads")
        .update({ 
          status: "offer_made",
          target_offer: offerData.purchasePrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Offer Saved",
        description: "Lead status updated to Offer Made.",
      });

      navigate(`/seller-leads/${lead.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save offer.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Lead not found</h2>
          <Button onClick={() => navigate("/seller-leads")} className="mt-4">
            Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const savings = lead.asking_price - offerData.purchasePrice;
  const savingsPercent = ((savings / lead.asking_price) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Make Offer</h1>
            <p className="text-muted-foreground mt-1">
              {lead.name} • {lead.address}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="offer" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Offer Terms</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Contract</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2" disabled={!contractContent}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Review & Send</span>
            </TabsTrigger>
          </TabsList>

          {/* Offer Terms Tab */}
          <TabsContent value="offer" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Lead Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seller</span>
                      <span className="font-medium">{lead.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Property</span>
                      <span className="font-medium capitalize">{lead.home_type || "single"} wide</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Year Built</span>
                      <span className="font-medium">{lead.year_built || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Asking Price</span>
                      <span className="font-medium">{formatCurrency(lead.asking_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target Offer</span>
                      <Badge variant="secondary">{formatCurrency(lead.target_offer || 0)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle>Offer Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Asking Price</div>
                        <div className="text-xl font-semibold">{formatCurrency(lead.asking_price)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Your Offer</div>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(offerData.purchasePrice)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t text-center">
                      <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(savings)}</div>
                      <div className="text-sm text-muted-foreground">{savingsPercent}% below asking</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Offer Details</CardTitle>
                  <CardDescription>Set the terms for your purchase offer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="purchasePrice"
                          type="number"
                          className="pl-9"
                          value={offerData.purchasePrice}
                          onChange={(e) =>
                            setOfferData((prev) => ({
                              ...prev,
                              purchasePrice: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="earnestMoney">Earnest Money</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="earnestMoney"
                          type="number"
                          className="pl-9"
                          value={offerData.earnestMoney}
                          onChange={(e) =>
                            setOfferData((prev) => ({
                              ...prev,
                              earnestMoney: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closingDate">Closing Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="closingDate"
                          type="date"
                          className="pl-9"
                          value={offerData.closingDate}
                          onChange={(e) =>
                            setOfferData((prev) => ({
                              ...prev,
                              closingDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="financing">Financing</Label>
                      <Select
                        value={offerData.financing}
                        onValueChange={(value) =>
                          setOfferData((prev) => ({ ...prev, financing: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select financing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="conventional">Conventional Loan</SelectItem>
                          <SelectItem value="fha">FHA Loan</SelectItem>
                          <SelectItem value="owner">Owner Financing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyerName">Buyer Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="buyerName"
                          className="pl-9"
                          placeholder="Your company or name"
                          value={offerData.buyerName}
                          onChange={(e) =>
                            setOfferData((prev) => ({
                              ...prev,
                              buyerName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inspectionPeriod">Inspection Period (days)</Label>
                      <Input
                        id="inspectionPeriod"
                        type="number"
                        value={offerData.inspectionPeriod}
                        onChange={(e) =>
                          setOfferData((prev) => ({
                            ...prev,
                            inspectionPeriod: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialTerms">Special Terms</Label>
                    <Textarea
                      id="specialTerms"
                      placeholder="Any special conditions or terms for the offer..."
                      className="min-h-[100px]"
                      value={offerData.specialTerms}
                      onChange={(e) =>
                        setOfferData((prev) => ({
                          ...prev,
                          specialTerms: e.target.value,
                        }))
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setActiveTab("generate")} className="ml-auto">
                    Continue to Generate Contract
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Generate Contract Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Contract Generator
                </CardTitle>
                <CardDescription>Generate a professional contract using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contract Summary */}
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-3">Contract Summary</h4>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Purchase Price:</span>{" "}
                      <span className="font-medium">{formatCurrency(offerData.purchasePrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Earnest Money:</span>{" "}
                      <span className="font-medium">{formatCurrency(offerData.earnestMoney)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Closing Date:</span>{" "}
                      <span className="font-medium">{format(new Date(offerData.closingDate), "MMMM d, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Financing:</span>{" "}
                      <span className="font-medium capitalize">{offerData.financing}</span>
                    </div>
                  </div>
                </div>

                {/* Template Selector */}
                <ContractTemplateSelector
                  selectedTemplateId={selectedTemplate?.id || null}
                  onTemplateSelect={setSelectedTemplate}
                />

                {/* Customization Notes from Lead */}
                {lead.notes && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Customization Instructions (from Lead Notes)
                    </Label>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The AI will use these notes to customize the contract with specific terms and clauses.
                    </p>
                  </div>
                )}

                {/* Contract Type (only show if no template selected) */}
                {!selectedTemplate && (
                  <div className="space-y-2">
                    <Label>Contract Type</Label>
                    <Select
                      value={contractType}
                      onValueChange={(value: "purchase_agreement" | "option_agreement" | "assignment") => setContractType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase_agreement">Purchase Agreement</SelectItem>
                        <SelectItem value="option_agreement">Option Agreement</SelectItem>
                        <SelectItem value="assignment">Assignment Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-col items-center gap-4 py-4">
                  <Button onClick={generateContract} disabled={generating} size="lg" className="px-8">
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedTemplate ? "Generating from Template..." : "Generating Contract..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {selectedTemplate ? "Generate from Template" : "Generate AI Contract"}
                      </>
                    )}
                  </Button>

                  {generating && (
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedTemplate ? (
                        <>
                          Using your "{selectedTemplate.name}" template as the base...
                          <br />
                          Applying customizations and filling in placeholders.
                        </>
                      ) : (
                        <>
                          Our AI is crafting a professional contract from scratch...
                          <br />
                          This usually takes 10-20 seconds.
                        </>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review & Send Tab */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Contract</CardTitle>
                <CardDescription>Review the generated contract before sending for signature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-medium">Contract Preview</h4>
                    <p className="text-sm text-muted-foreground">
                      Generated on {format(new Date(), "MMMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab("offer")}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Terms
                    </Button>
                    <Button variant="outline" onClick={downloadContract}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/30 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{contractContent}</pre>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Contract Saved</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          The contract has been generated and saved to your contracts.
                        </p>
                      </div>
                    </div>
                    {savedContractId && (
                      <Link to="/contracts">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Contracts
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" onClick={downloadContract}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <SendToDocuSignButton 
                    contractData={{
                      sellerName: lead.name,
                      sellerEmail: lead.email || "",
                      buyerName: offerData.buyerName,
                      propertyAddress: `${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}`,
                      purchasePrice: offerData.purchasePrice,
                      earnestMoney: offerData.earnestMoney,
                      closingDate: offerData.closingDate,
                      specialTerms: offerData.specialTerms,
                    }}
                  />
                  <Button onClick={saveAndUpdateStatus}>
                    <Send className="mr-2 h-4 w-4" />
                    Save & Update Lead
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
