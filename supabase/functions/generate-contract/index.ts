import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractRequest {
  leadData: {
    name: string;
    phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    home_type: string;
    year_built?: number;
    asking_price: number;
    target_offer: number;
    lot_rent?: number;
    condition?: number;
    notes?: string;
  };
  offerData: {
    purchasePrice: number;
    earnestMoney: number;
    closingDate: string;
    financing: string;
    inspectionPeriod: number;
    specialTerms?: string;
    buyerName?: string;
    buyerAddress?: string;
  };
  templateContent?: string;
  templateId?: string;
  customizationNotes?: string;
  contractType: "purchase_agreement" | "option_agreement" | "assignment";
  // Legacy fields for backwards compatibility
  buyerName?: string;
  buyerAddress?: string;
}

// Standard placeholders to replace in templates
const replacePlaceholders = (
  template: string,
  leadData: ContractRequest["leadData"],
  offerData: ContractRequest["offerData"]
): string => {
  const fullAddress = [leadData.address, leadData.city, leadData.state, leadData.zip]
    .filter(Boolean)
    .join(", ");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const replacements: Record<string, string> = {
    "[SELLER_NAME]": leadData.name || "",
    "[SELLER_PHONE]": leadData.phone || "",
    "[SELLER_EMAIL]": leadData.email || "",
    "[PROPERTY_ADDRESS]": fullAddress,
    "[HOME_TYPE]": (leadData.home_type || "single") + " wide",
    "[YEAR_BUILT]": leadData.year_built?.toString() || "Unknown",
    "[ASKING_PRICE]": formatCurrency(leadData.asking_price),
    "[PURCHASE_PRICE]": formatCurrency(offerData.purchasePrice),
    "[EARNEST_MONEY]": formatCurrency(offerData.earnestMoney),
    "[CLOSING_DATE]": formatDate(offerData.closingDate),
    "[INSPECTION_PERIOD]": offerData.inspectionPeriod.toString(),
    "[FINANCING_TYPE]": offerData.financing,
    "[BUYER_NAME]": offerData.buyerName || "[Buyer Name]",
    "[BUYER_ADDRESS]": offerData.buyerAddress || "[Buyer Address]",
    "[DATE]": new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "[LOT_RENT]": leadData.lot_rent ? formatCurrency(leadData.lot_rent) : "N/A",
    "[CONDITION]": leadData.condition?.toString() || "N/A",
    "[SPECIAL_TERMS]": offerData.specialTerms || "",
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[[\]]/g, "\\$&"), "g"), value);
  }

  return result;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: ContractRequest = await req.json();
    const {
      leadData,
      offerData,
      templateContent,
      customizationNotes,
      contractType,
      buyerName,
      buyerAddress,
    } = requestData;

    // Build offerData from legacy fields if not provided
    const finalOfferData = offerData || {
      purchasePrice: leadData.target_offer,
      earnestMoney: Math.round(leadData.target_offer * 0.01),
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      financing: "cash",
      inspectionPeriod: 10,
      buyerName: buyerName,
      buyerAddress: buyerAddress,
    };

    console.log("Generating contract for:", leadData.name, "Type:", contractType);
    console.log("Using template:", templateContent ? "Yes" : "No (from scratch)");
    console.log("Customization notes:", customizationNotes ? "Yes" : "No");

    let systemPrompt: string;
    let userPrompt: string;

    if (templateContent) {
      // TEMPLATE-BASED GENERATION MODE
      // First, replace standard placeholders
      const filledTemplate = replacePlaceholders(templateContent, leadData, finalOfferData);

      systemPrompt = `You are a legal document assistant specializing in mobile home real estate transactions.

Your task is to take the user's contract template as the BASE and make intelligent modifications based on their customization instructions.

CRITICAL RULES:
1. PRESERVE the overall structure and legal language of the template
2. DO NOT add new sections unless specifically requested in the customization notes
3. Fill in any remaining placeholders or bracketed text with appropriate information
4. Apply the specific modifications requested in the customization notes
5. Maintain professional formatting with proper sections and numbered paragraphs
6. If the customization notes mention specific terms or clauses, integrate them naturally into the document
7. Format all currency values properly (e.g., $50,000)
8. Format all dates in a readable format (e.g., January 15, 2025)`;

      userPrompt = `Here is my contract template with placeholders already filled in:

---BEGIN TEMPLATE---
${filledTemplate}
---END TEMPLATE---

LEAD/PROPERTY DATA:
- Seller Name: ${leadData.name}
- Seller Phone: ${leadData.phone || "Not provided"}
- Seller Email: ${leadData.email || "Not provided"}
- Property Address: ${leadData.address}${leadData.city ? `, ${leadData.city}` : ""}${leadData.state ? `, ${leadData.state}` : ""} ${leadData.zip || ""}
- Property Type: ${leadData.home_type || "single"} wide mobile home
- Year Built: ${leadData.year_built || "Unknown"}
- Lot Rent: ${leadData.lot_rent ? `$${leadData.lot_rent}/month` : "N/A"}

OFFER DATA:
- Purchase Price: $${finalOfferData.purchasePrice.toLocaleString()}
- Earnest Money: $${finalOfferData.earnestMoney.toLocaleString()}
- Closing Date: ${finalOfferData.closingDate}
- Financing: ${finalOfferData.financing}
- Inspection Period: ${finalOfferData.inspectionPeriod} days
- Buyer Name: ${finalOfferData.buyerName || "[To be filled]"}

${customizationNotes ? `CUSTOMIZATION INSTRUCTIONS (from lead notes):
${customizationNotes}

Please apply these specific modifications to the template while preserving its structure.` : "No specific customizations requested. Please ensure the template is complete and professional."}

${finalOfferData.specialTerms ? `ADDITIONAL SPECIAL TERMS:
${finalOfferData.specialTerms}` : ""}

Generate the final contract document based on my template and the above information.`;
    } else {
      // LEGACY FROM-SCRATCH GENERATION MODE
      const contractTypeDescriptions = {
        purchase_agreement: "a standard purchase agreement for buying a mobile home",
        option_agreement: "an option to purchase agreement that gives the buyer the right but not obligation to purchase",
        assignment: "an assignment of contract that allows the original buyer to assign their rights to a third party",
      };

      systemPrompt = `You are a legal document assistant specializing in mobile home real estate transactions. 
Generate professional, legally-sound contract documents based on the provided information. 
Include all standard clauses for ${contractTypeDescriptions[contractType]}.
Format the output as a clean, professional legal document with proper sections, numbered paragraphs, and signature lines.
Use TODAY's date as the contract date.
Include standard contingencies like inspection, title, and financing.`;

      userPrompt = `Generate ${contractTypeDescriptions[contractType]} with the following details:

SELLER INFORMATION:
- Name: ${leadData.name}
- Property Address: ${leadData.address}${leadData.city ? `, ${leadData.city}` : ""}${leadData.state ? `, ${leadData.state}` : ""} ${leadData.zip || ""}
- Property Type: ${leadData.home_type || "single"} wide mobile home
- Year Built: ${leadData.year_built || "Unknown"}

FINANCIAL TERMS:
- Purchase Price: $${finalOfferData.purchasePrice.toLocaleString()}
- Earnest Money Deposit: $${finalOfferData.earnestMoney.toLocaleString()}
- Closing Date: ${finalOfferData.closingDate}
- Financing Type: ${finalOfferData.financing}
- Inspection Period: ${finalOfferData.inspectionPeriod} days

${finalOfferData.buyerName ? `BUYER INFORMATION:
- Name: ${finalOfferData.buyerName}
- Address: ${finalOfferData.buyerAddress || "To be provided"}` : "BUYER: [Buyer Name to be filled in]"}

${finalOfferData.specialTerms ? `SPECIAL TERMS:
${finalOfferData.specialTerms}` : ""}

Please generate a complete, professional contract document.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContract = data.choices?.[0]?.message?.content;

    if (!generatedContract) {
      throw new Error("No content generated");
    }

    console.log("Contract generated successfully");

    return new Response(
      JSON.stringify({
        contract: generatedContract,
        contractType,
        usedTemplate: !!templateContent,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating contract:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
