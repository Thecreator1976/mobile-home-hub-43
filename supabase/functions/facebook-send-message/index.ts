import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  conversationId: string;
  messageType: "text" | "button_template";
  content?: string;
  buyerListUrl?: string;
  templateText?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const pageAccessToken = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
    const pageId = Deno.env.get("FACEBOOK_PAGE_ID");

    if (!pageAccessToken || !pageId) {
      console.error("Facebook credentials not configured");
      return new Response(
        JSON.stringify({ error: "Facebook integration not configured. Please add your Facebook credentials in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SendMessageRequest = await req.json();
    const { conversationId, messageType, content, buyerListUrl, templateText } = body;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation to find the PSID
    const { data: conversation, error: convError } = await supabase
      .from("messenger_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation not found:", convError);
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const psid = conversation.facebook_user_id;

    // Build the message payload
    let messagePayload: Record<string, unknown>;
    let storedContent: string;
    let storedMessageType: string;

    if (messageType === "button_template" && buyerListUrl) {
      // Button template message for Buyer List Link
      const buttonText = templateText || "Thanks for your interest! This mobile home has just gone under contract. Would you like to join our VIP Buyer List to get alerts for new sales?";
      
      messagePayload = {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: buttonText,
              buttons: [
                {
                  type: "web_url",
                  url: buyerListUrl,
                  title: "Yes, Send Me New Listings!",
                },
              ],
            },
          },
        },
      };
      storedContent = `[Buyer List Link] ${buttonText}`;
      storedMessageType = "button_template";
    } else {
      // Plain text message
      if (!content) {
        return new Response(
          JSON.stringify({ error: "content is required for text messages" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      messagePayload = {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: { text: content },
      };
      storedContent = content;
      storedMessageType = "text";
    }

    console.log("Sending message to Facebook:", JSON.stringify(messagePayload, null, 2));

    // Send message via Facebook Graph API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("Facebook API error:", fbResult);
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: fbResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Facebook API response:", fbResult);

    // Store the outbound message in database
    const { error: msgError } = await supabase
      .from("messenger_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        content: storedContent,
        message_type: storedMessageType,
        facebook_message_id: fbResult.message_id,
      });

    if (msgError) {
      console.error("Error storing outbound message:", msgError);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: fbResult.message_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send message error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
