import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface PropertyMatchRequest {
  sellerLead: {
    id: string;
    address: string;
    city?: string;
    state?: string;
    asking_price: number;
    home_type: string;
    condition?: number;
    year_built?: number;
    length_ft?: number;
    width_ft?: number;
    notes?: string;
  };
  buyers: Array<{
    id: string;
    name: string;
    min_price?: number;
    max_price?: number;
    home_types?: string[];
    locations?: string[];
    credit_score?: number;
    notes?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    console.log("AI Property Match - User:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { sellerLead, buyers } = await req.json() as PropertyMatchRequest;

    if (!sellerLead || !buyers || buyers.length === 0) {
      return new Response(
        JSON.stringify({ error: "sellerLead and buyers array are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert real estate matchmaking AI for mobile home sales. Your job is to analyze a seller's property and find the best matching buyers from a list.

For each buyer, evaluate compatibility based on:
1. **Price Match** (40% weight): Does the property's asking price fall within the buyer's budget range?
2. **Home Type Match** (25% weight): Does the property type match what the buyer is looking for?
3. **Location Match** (20% weight): Is the property in a location the buyer prefers?
4. **Property Condition/Age** (15% weight): Does the property condition and age suit the buyer's needs?

Consider buyer notes for additional preferences they may have expressed.

Return a JSON array of the top 5 matches with scores >= 50, sorted by score descending.`;

    const userPrompt = `PROPERTY FOR SALE:
- Address: ${sellerLead.address}${sellerLead.city ? `, ${sellerLead.city}` : ""}${sellerLead.state ? `, ${sellerLead.state}` : ""}
- Asking Price: $${sellerLead.asking_price.toLocaleString()}
- Home Type: ${sellerLead.home_type} wide
- Year Built: ${sellerLead.year_built || "Unknown"}
- Size: ${sellerLead.length_ft && sellerLead.width_ft ? `${sellerLead.length_ft}x${sellerLead.width_ft} ft` : "Unknown"}
- Condition: ${sellerLead.condition || "Not rated"}/5
${sellerLead.notes ? `- Notes: ${sellerLead.notes}` : ""}

POTENTIAL BUYERS:
${buyers.map((b, i) => `
${i + 1}. ${b.name} (ID: ${b.id})
   - Budget: $${(b.min_price || 0).toLocaleString()} - $${(b.max_price || 999999).toLocaleString()}
   - Looking for: ${b.home_types?.join(", ") || "Any type"}
   - Preferred locations: ${b.locations?.join(", ") || "Any location"}
   - Credit Score: ${b.credit_score || "Unknown"}
   ${b.notes ? `- Notes: ${b.notes}` : ""}`).join("\n")}

Analyze each buyer and return ONLY a JSON array with this exact format:
[
  {
    "buyerId": "uuid-string",
    "buyerName": "Name",
    "matchScore": 85,
    "reasons": ["Price within budget", "Preferred home type", "Location match"],
    "recommendation": "Strong match - buyer's budget and preferences align well with this property"
  }
]

Return only buyers with matchScore >= 50, maximum 5 results, sorted by matchScore descending. Return ONLY the JSON array, no other text.`;

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
        temperature: 0.3,
        max_tokens: 2000,
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
    let content = data.choices?.[0]?.message?.content || "[]";

    // Clean up the response - extract JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    let matches;
    try {
      matches = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      matches = [];
    }

    console.log("AI Property Match completed:", matches.length, "matches found");

    return new Response(
      JSON.stringify({ matches, propertyId: sellerLead.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in AI property match:", error);
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
