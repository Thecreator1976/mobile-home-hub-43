import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Home, DollarSign, FileText, User } from "lucide-react";
import BasicInfoForm from "@/components/leads/forms/BasicInfoForm";
import PropertyInfoForm from "@/components/leads/forms/PropertyInfoForm";
import FinancialInfoForm from "@/components/leads/forms/FinancialInfoForm";
import DocumentsForm from "@/components/leads/forms/DocumentsForm";
import { useSellerLeads, CreateLeadInput } from "@/hooks/useSellerLeads";

interface LeadFormData {
  basicInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes: string;
  };
  propertyInfo: {
    homeType: string;
    yearBuilt: number;
    condition: number;
    length: number;
    width: number;
    parkOwned: boolean;
    lotRent: number;
  };
  financialInfo: {
    askingPrice: number;
    owedAmount: number;
    estimatedValue: number;
    targetOffer: number;
    notes: string;
  };
  documents: {
    photos: string[];
    files: string[];
  };
}

export default function NewSellerLead() {
  const navigate = useNavigate();
  const { createLead } = useSellerLeads();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<LeadFormData>({
    basicInfo: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    },
    propertyInfo: {
      homeType: "single",
      yearBuilt: new Date().getFullYear(),
      condition: 3,
      length: 0,
      width: 0,
      parkOwned: true,
      lotRent: 0,
    },
    financialInfo: {
      askingPrice: 0,
      owedAmount: 0,
      estimatedValue: 0,
      targetOffer: 0,
      notes: "",
    },
    documents: {
      photos: [],
      files: [],
    },
  });

  const handleInputChange = (section: keyof LeadFormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const calculateEstimatedValue = () => {
    const { propertyInfo } = formData;
    const basePricePerSqFt = 50;
    const conditionMultiplier = (propertyInfo.condition || 3) / 3;
    const ageFactor = Math.max(0, 1 - (new Date().getFullYear() - (propertyInfo.yearBuilt || 2000)) * 0.01);
    const squareFeet = (propertyInfo.length || 0) * (propertyInfo.width || 0);
    
    if (squareFeet === 0) return 0;
    return Math.round(squareFeet * basePricePerSqFt * conditionMultiplier * ageFactor);
  };

  const calculateTargetOffer = () => {
    const estimatedValue = calculateEstimatedValue();
    return Math.round(estimatedValue * 0.7);
  };

  const handleCalculate = () => {
    const estimatedValue = calculateEstimatedValue();
    const targetOffer = calculateTargetOffer();
    handleInputChange("financialInfo", "estimatedValue", estimatedValue);
    handleInputChange("financialInfo", "targetOffer", targetOffer);
  };

  const handleNext = () => {
    if (activeTab === "basic") setActiveTab("property");
    else if (activeTab === "property") setActiveTab("financial");
    else if (activeTab === "financial") setActiveTab("documents");
  };

  const handleBack = () => {
    if (activeTab === "property") setActiveTab("basic");
    else if (activeTab === "financial") setActiveTab("property");
    else if (activeTab === "documents") setActiveTab("financial");
  };

  const handleSubmit = async () => {
    if (!formData.basicInfo.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Seller name is required.",
        variant: "destructive",
      });
      setActiveTab("basic");
      return;
    }

    if (!formData.basicInfo.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Property address is required.",
        variant: "destructive",
      });
      setActiveTab("basic");
      return;
    }

    if (!formData.financialInfo.askingPrice) {
      toast({
        title: "Validation Error",
        description: "Asking price is required.",
        variant: "destructive",
      });
      setActiveTab("financial");
      return;
    }

    const leadInput: CreateLeadInput = {
      name: formData.basicInfo.name,
      phone: formData.basicInfo.phone || undefined,
      email: formData.basicInfo.email || undefined,
      address: formData.basicInfo.address,
      city: formData.basicInfo.city || undefined,
      state: formData.basicInfo.state || undefined,
      zip: formData.basicInfo.zip || undefined,
      home_type: formData.propertyInfo.homeType as "single" | "double" | "triple",
      year_built: formData.propertyInfo.yearBuilt || undefined,
      condition: formData.propertyInfo.condition || undefined,
      length_ft: formData.propertyInfo.length || undefined,
      width_ft: formData.propertyInfo.width || undefined,
      park_owned: formData.propertyInfo.parkOwned,
      lot_rent: formData.propertyInfo.lotRent || undefined,
      asking_price: formData.financialInfo.askingPrice,
      owed_amount: formData.financialInfo.owedAmount || undefined,
      estimated_value: formData.financialInfo.estimatedValue || calculateEstimatedValue() || undefined,
      target_offer: formData.financialInfo.targetOffer || calculateTargetOffer() || undefined,
      notes: formData.basicInfo.notes || formData.financialInfo.notes || undefined,
    };

    createLead.mutate(leadInput, {
      onSuccess: () => {
        navigate("/seller-leads");
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Seller Lead</h1>
            <p className="text-muted-foreground mt-1">
              Add a new mobile home seller lead to your pipeline
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>
              Complete all sections to create a new seller lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="property" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Property</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Financial</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-6">
                <BasicInfoForm
                  data={formData.basicInfo}
                  onChange={(field, value) => handleInputChange("basicInfo", field, value)}
                />
              </TabsContent>

              <TabsContent value="property" className="space-y-4 pt-6">
                <PropertyInfoForm
                  data={formData.propertyInfo}
                  onChange={(field, value) => handleInputChange("propertyInfo", field, value)}
                  onCalculate={handleCalculate}
                />
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 pt-6">
                <FinancialInfoForm
                  data={formData.financialInfo}
                  onChange={(field, value) => handleInputChange("financialInfo", field, value)}
                  calculatedEstimatedValue={calculateEstimatedValue()}
                  calculatedTargetOffer={calculateTargetOffer()}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 pt-6">
                <DocumentsForm
                  data={formData.documents}
                  onChange={(field, value) => handleInputChange("documents", field, value)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <div className="flex space-x-2">
              {activeTab !== "basic" && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate("/seller-leads")}>
                Cancel
              </Button>
              {activeTab !== "documents" ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Lead
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
