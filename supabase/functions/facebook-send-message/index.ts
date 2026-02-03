import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import {
  validateString,
  validateEnum,
  validateUUID,
  validateUrl,
  validateFields,
  validationErrorResponse,
  MAX_LENGTHS,
} from "../_shared/validation.ts";

interface SendMessageRequest {
  conversationId: string;
  messageType: "text" | "button_template";
  content?: string;
  buyerListUrl?: string;
  templateText?: string;
}

function validateSendMessageRequest(data: unknown): { valid: boolean; errors: string[]; sanitized?: SendMessageRequest } {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body is required"] };
  }

  const req = data as Record<string, unknown>;

  const validation = validateFields([
    { result: validateUUID(req.conversationId, "Conversation ID", true), field: "conversationId" },
    { result: validateEnum(req.messageType, "Message type", ["text", "button_template"] as const, true), field: "messageType" },
    { result: validateString(req.content, "Content", { maxLength: MAX_LENGTHS.content }), field: "content" },
    { result: validateUrl(req.buyerListUrl), field: "buyerListUrl" },
    { result: validateString(req.templateText, "Template text", { maxLength: MAX_LENGTHS.templateText }), field: "templateText" },
  ]);

  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  const messageType = validation.sanitized.messageType as "text" | "button_template";
  
  // Additional validation based on message type
  if (messageType === "text" && !validation.sanitized.content) {
    return { valid: false, errors: ["Content is required for text messages"] };
  }

  if (messageType === "button_template" && !validation.sanitized.buyerListUrl) {
    return { valid: false, errors: ["Buyer list URL is required for button template messages"] };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      conversationId: validation.sanitized.conversationId as string,
      messageType,
      content: validation.sanitized.content as string | undefined,
      buyerListUrl: validation.sanitized.buyerListUrl as string | undefined,
      templateText: validation.sanitized.templateText as string | undefined,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    console.log("Authenticated user:", userId);

    const pageAccessToken = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
    const pageId = Deno.env.get("FACEBOOK_PAGE_ID");

    if (!pageAccessToken || !pageId) {
      console.error("Facebook credentials not configured");
      return new Response(
        JSON.stringify({ error: "Facebook integration not configured. Please add your Facebook credentials in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData = await req.json();
    const validation = validateSendMessageRequest(rawData);

    if (!validation.valid || !validation.sanitized) {
      console.error("Validation errors:", validation.errors);
      return validationErrorResponse(validation.errors, corsHeaders);
    }

    const { conversationId, messageType, content, buyerListUrl, templateText } = validation.sanitized;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    let messagePayload: Record<string, unknown>;
    let storedContent: string;
    let storedMessageType: string;

    if (messageType === "button_template" && buyerListUrl) {
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
      messagePayload = {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: { text: content },
      };
      storedContent = content!;
      storedMessageType = "text";
    }

    console.log("Sending message to Facebook");

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
    
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
