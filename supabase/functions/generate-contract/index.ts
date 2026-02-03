import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import {
  validateString,
  validateNumber,
  validateEmail,
  validateEnum,
  validateFields,
  validationErrorResponse,
  MAX_LENGTHS,
} from "../_shared/validation.ts";

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
  buyerName?: string;
  buyerAddress?: string;
}

// Validate and sanitize the contract request
function validateContractRequest(data: unknown): { valid: boolean; errors: string[]; sanitized?: ContractRequest } {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body is required"] };
  }

  const req = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!req.leadData || typeof req.leadData !== "object") {
    return { valid: false, errors: ["leadData is required"] };
  }

  const lead = req.leadData as Record<string, unknown>;
  const offer = (req.offerData as Record<string, unknown>) || {};

  const leadValidations = validateFields([
    { result: validateString(lead.name, "Seller name", { required: true, maxLength: MAX_LENGTHS.name }), field: "name" },
    { result: validateString(lead.phone, "Phone", { maxLength: MAX_LENGTHS.phone }), field: "phone" },
    { result: validateEmail(lead.email), field: "email" },
    { result: validateString(lead.address, "Address", { required: true, maxLength: MAX_LENGTHS.address }), field: "address" },
    { result: validateString(lead.city, "City", { maxLength: 100 }), field: "city" },
    { result: validateString(lead.state, "State", { maxLength: 50 }), field: "state" },
    { result: validateString(lead.zip, "ZIP", { maxLength: 20 }), field: "zip" },
    { result: validateString(lead.home_type, "Home type", { maxLength: 50 }), field: "home_type" },
    { result: validateNumber(lead.year_built, "Year built", { min: 1900, max: new Date().getFullYear() + 1, integer: true }), field: "year_built" },
    { result: validateNumber(lead.asking_price, "Asking price", { required: true, min: 0, max: 100000000 }), field: "asking_price" },
    { result: validateNumber(lead.target_offer, "Target offer", { required: true, min: 0, max: 100000000 }), field: "target_offer" },
    { result: validateNumber(lead.lot_rent, "Lot rent", { min: 0, max: 10000 }), field: "lot_rent" },
    { result: validateNumber(lead.condition, "Condition", { min: 1, max: 10, integer: true }), field: "condition" },
    { result: validateString(lead.notes, "Notes", { maxLength: MAX_LENGTHS.notes, sanitizeForAI: true }), field: "notes" },
  ]);

  if (!leadValidations.valid) {
    errors.push(...leadValidations.errors);
  }

  const offerValidations = validateFields([
    { result: validateNumber(offer.purchasePrice, "Purchase price", { min: 0, max: 100000000 }), field: "purchasePrice" },
    { result: validateNumber(offer.earnestMoney, "Earnest money", { min: 0, max: 10000000 }), field: "earnestMoney" },
    { result: validateString(offer.closingDate, "Closing date", { maxLength: 50 }), field: "closingDate" },
    { result: validateString(offer.financing, "Financing", { maxLength: 100 }), field: "financing" },
    { result: validateNumber(offer.inspectionPeriod, "Inspection period", { min: 0, max: 365, integer: true }), field: "inspectionPeriod" },
    { result: validateString(offer.specialTerms, "Special terms", { maxLength: MAX_LENGTHS.specialTerms, sanitizeForAI: true }), field: "specialTerms" },
    { result: validateString(offer.buyerName, "Buyer name", { maxLength: MAX_LENGTHS.name }), field: "buyerName" },
    { result: validateString(offer.buyerAddress, "Buyer address", { maxLength: MAX_LENGTHS.address }), field: "buyerAddress" },
  ]);

  if (!offerValidations.valid) {
    errors.push(...offerValidations.errors);
  }

  const contractTypeResult = validateEnum(
    req.contractType,
    "Contract type",
    ["purchase_agreement", "option_agreement", "assignment"] as const,
    true
  );
  if (!contractTypeResult.valid) {
    errors.push(contractTypeResult.error!);
  }

  const templateContentResult = validateString(req.templateContent, "Template content", { maxLength: 50000 });
  if (!templateContentResult.valid) {
    errors.push(templateContentResult.error!);
  }

  const customizationNotesResult = validateString(req.customizationNotes, "Customization notes", { 
    maxLength: MAX_LENGTHS.notes, 
    sanitizeForAI: true 
  });
  if (!customizationNotesResult.valid) {
    errors.push(customizationNotesResult.error!);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: ContractRequest = {
    leadData: {
      name: leadValidations.sanitized.name as string,
      phone: leadValidations.sanitized.phone as string | undefined,
      email: leadValidations.sanitized.email as string | undefined,
      address: leadValidations.sanitized.address as string,
      city: leadValidations.sanitized.city as string | undefined,
      state: leadValidations.sanitized.state as string | undefined,
      zip: leadValidations.sanitized.zip as string | undefined,
      home_type: (leadValidations.sanitized.home_type as string) || "single",
      year_built: leadValidations.sanitized.year_built as number | undefined,
      asking_price: leadValidations.sanitized.asking_price as number,
      target_offer: leadValidations.sanitized.target_offer as number,
      lot_rent: leadValidations.sanitized.lot_rent as number | undefined,
      condition: leadValidations.sanitized.condition as number | undefined,
      notes: leadValidations.sanitized.notes as string | undefined,
    },
    offerData: {
      purchasePrice: (offerValidations.sanitized.purchasePrice as number) || (leadValidations.sanitized.target_offer as number),
      earnestMoney: (offerValidations.sanitized.earnestMoney as number) || Math.round((leadValidations.sanitized.target_offer as number) * 0.01),
      closingDate: (offerValidations.sanitized.closingDate as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      financing: (offerValidations.sanitized.financing as string) || "cash",
      inspectionPeriod: (offerValidations.sanitized.inspectionPeriod as number) || 10,
      specialTerms: offerValidations.sanitized.specialTerms as string | undefined,
      buyerName: (offerValidations.sanitized.buyerName as string) || (req.buyerName as string),
      buyerAddress: (offerValidations.sanitized.buyerAddress as string) || (req.buyerAddress as string),
    },
    templateContent: templateContentResult.sanitized as string | undefined,
    customizationNotes: customizationNotesResult.sanitized as string | undefined,
    contractType: contractTypeResult.sanitized as "purchase_agreement" | "option_agreement" | "assignment",
  };

  return { valid: true, errors: [], sanitized };
}

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    console.log("Authenticated user:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const rawData = await req.json();
    const validation = validateContractRequest(rawData);
    
    if (!validation.valid || !validation.sanitized) {
      console.error("Validation errors:", validation.errors);
      return validationErrorResponse(validation.errors, corsHeaders);
    }

    const { leadData, offerData, templateContent, customizationNotes, contractType } = validation.sanitized;

    console.log("Generating contract for:", leadData.name, "Type:", contractType);

    let systemPrompt: string;
    let userPrompt: string;

    if (templateContent) {
      const filledTemplate = replacePlaceholders(templateContent, leadData, offerData);

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
- Purchase Price: $${offerData.purchasePrice.toLocaleString()}
- Earnest Money: $${offerData.earnestMoney.toLocaleString()}
- Closing Date: ${offerData.closingDate}
- Financing: ${offerData.financing}
- Inspection Period: ${offerData.inspectionPeriod} days
- Buyer Name: ${offerData.buyerName || "[To be filled]"}

${customizationNotes ? `CUSTOMIZATION INSTRUCTIONS:
${customizationNotes}

Please apply these specific modifications to the template while preserving its structure.` : "No specific customizations requested. Please ensure the template is complete and professional."}

${offerData.specialTerms ? `ADDITIONAL SPECIAL TERMS:
${offerData.specialTerms}` : ""}

Generate the final contract document based on my template and the above information.`;
    } else {
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
- Purchase Price: $${offerData.purchasePrice.toLocaleString()}
- Earnest Money Deposit: $${offerData.earnestMoney.toLocaleString()}
- Closing Date: ${offerData.closingDate}
- Financing Type: ${offerData.financing}
- Inspection Period: ${offerData.inspectionPeriod} days

${offerData.buyerName ? `BUYER INFORMATION:
- Name: ${offerData.buyerName}
- Address: ${offerData.buyerAddress || "To be provided"}` : "BUYER: [Buyer Name to be filled in]"}

${offerData.specialTerms ? `SPECIAL TERMS:
${offerData.specialTerms}` : ""}

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
    
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
