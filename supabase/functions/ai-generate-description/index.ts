import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface DescriptionRequest {
  property: {
    address: string;
    city?: string;
    state?: string;
    home_type: string;
    year_built?: number;
    length_ft?: number;
    width_ft?: number;
    condition?: number;
    asking_price?: number;
    lot_rent?: number;
    park_owned?: boolean;
    notes?: string;
  };
  style?: "professional" | "casual" | "detailed" | "brief";
  purpose?: "listing" | "social" | "email";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    console.log("AI Generate Description - User:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { property, style = "professional", purpose = "listing" } = await req.json() as DescriptionRequest;

    if (!property || !property.address) {
      return new Response(
        JSON.stringify({ error: "Property data with address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const styleGuides = {
      professional: "Write in a professional, real estate agent tone. Focus on key selling points and investment potential.",
      casual: "Write in a friendly, approachable tone. Make it feel welcoming and highlight lifestyle benefits.",
      detailed: "Write a comprehensive description covering all features. Include specific details and measurements.",
      brief: "Write a concise, punchy description. Keep it under 100 words but impactful.",
    };

    const purposeGuides = {
      listing: "This is for a property listing website. Include all relevant details a buyer would want to know.",
      social: "This is for social media. Make it engaging and include a call to action. Keep it brief.",
      email: "This is for an email to potential buyers. Be personal and highlight why this property matches their needs.",
    };

    const systemPrompt = `You are an expert real estate copywriter specializing in mobile home properties. 
Write compelling property descriptions that highlight the best features and appeal to potential buyers.

Style: ${styleGuides[style]}
Purpose: ${purposeGuides[purpose]}

Focus on:
- Location and community benefits
- Size and layout advantages
- Condition and any recent updates
- Value proposition
- Lifestyle appeal

Do NOT include:
- Made-up features not provided in the data
- Unrealistic claims
- Legal promises or guarantees`;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

    const userPrompt = `Generate a ${style} property description for ${purpose} use:

PROPERTY DETAILS:
- Address: ${property.address}${property.city ? `, ${property.city}` : ""}${property.state ? `, ${property.state}` : ""}
- Type: ${property.home_type} wide mobile home
- Year Built: ${property.year_built || "Not specified"}
- Size: ${property.length_ft && property.width_ft ? `${property.length_ft} x ${property.width_ft} feet (${property.length_ft * property.width_ft} sq ft)` : "Not specified"}
- Condition: ${property.condition ? `${property.condition}/5` : "Not rated"}
${property.asking_price ? `- Asking Price: ${formatCurrency(property.asking_price)}` : ""}
${property.lot_rent ? `- Lot Rent: ${formatCurrency(property.lot_rent)}/month` : ""}
${property.park_owned ? "- Located in a park-owned community" : ""}
${property.notes ? `- Additional Notes: ${property.notes}` : ""}

Generate a compelling description that will attract potential buyers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
    const description = data.choices?.[0]?.message?.content || "";

    console.log("AI Description generated successfully");

    return new Response(
      JSON.stringify({ 
        description: description.trim(),
        style,
        purpose,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating description:", error);
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
