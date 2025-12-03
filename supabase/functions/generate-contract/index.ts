import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractRequest {
  leadData: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    home_type: string;
    year_built?: number;
    asking_price: number;
    target_offer: number;
  };
  contractType: "purchase_agreement" | "option_agreement" | "assignment";
  buyerName?: string;
  buyerAddress?: string;
}

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

    const { leadData, contractType, buyerName, buyerAddress }: ContractRequest = await req.json();
    
    console.log("Generating contract for:", leadData.name, "Type:", contractType);

    const contractTypeDescriptions = {
      purchase_agreement: "a standard purchase agreement for buying a mobile home",
      option_agreement: "an option to purchase agreement that gives the buyer the right but not obligation to purchase",
      assignment: "an assignment of contract that allows the original buyer to assign their rights to a third party",
    };

    const systemPrompt = `You are a legal document assistant specializing in mobile home real estate transactions. 
Generate professional, legally-sound contract documents based on the provided information. 
Include all standard clauses for ${contractTypeDescriptions[contractType]}.
Format the output as a clean, professional legal document with proper sections, numbered paragraphs, and signature lines.
Use TODAY's date as the contract date.
Include standard contingencies like inspection, title, and financing.`;

    const userPrompt = `Generate ${contractTypeDescriptions[contractType]} with the following details:

SELLER INFORMATION:
- Name: ${leadData.name}
- Property Address: ${leadData.address}${leadData.city ? `, ${leadData.city}` : ""}${leadData.state ? `, ${leadData.state}` : ""} ${leadData.zip || ""}
- Property Type: ${leadData.home_type} wide mobile home
- Year Built: ${leadData.year_built || "Unknown"}

FINANCIAL TERMS:
- Purchase Price: $${leadData.target_offer.toLocaleString()}
- Earnest Money Deposit: $${Math.round(leadData.target_offer * 0.01).toLocaleString()} (1%)

${buyerName ? `BUYER INFORMATION:
- Name: ${buyerName}
- Address: ${buyerAddress || "To be provided"}` : "BUYER: [Buyer Name to be filled in]"}

Please generate a complete, professional contract document.`;

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
        max_tokens: 4000,
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
