import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

// Generate a safe reference ID for error tracking
function generateSafeReferenceId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Safe error handler - logs securely without exposing sensitive data
function safeErrorHandler(error: unknown, context?: string): { error: string; referenceId: string } {
  const referenceId = generateSafeReferenceId();

  // Log safely without sensitive data
  console.error("Safe error log:", {
    context,
    referenceId,
    errorType: error instanceof Error ? error.name : "Unknown",
    errorCode: (error as { code?: string })?.code || "unknown",
    timestamp: new Date().toISOString(),
    // Never log: full error message, stack traces, request bodies, user data
  });

  // Return safe error to client
  return {
    error: "An error occurred",
    referenceId, // For tracking without exposing details
  };
}

// HMAC-SHA256 signature verification
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const expectedSignature = `sha256=${hashHex}`;

  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // GET request: Facebook webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const verifyToken = Deno.env.get("FACEBOOK_VERIFY_TOKEN");

      if (!verifyToken) {
        console.error("Webhook configuration error: verify token missing");
        return new Response("Webhook not configured", { status: 500, headers: corsHeaders });
      }

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200, headers: corsHeaders });
      } else {
        console.error("Webhook verification failed - mode or token mismatch");
        return new Response("Verification failed", { status: 403, headers: corsHeaders });
      }
    }

    // POST request: Handle incoming messages
    if (req.method === "POST") {
      const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");

      if (!appSecret) {
        console.error("Webhook configuration error: app secret missing");
        return new Response("Webhook not configured", { status: 500, headers: corsHeaders });
      }

      const body = await req.text();
      const signature = req.headers.get("x-hub-signature-256");

      // Verify signature - REQUIRED for security
      if (!signature) {
        console.error("Missing signature header");
        return new Response("Missing signature", { status: 401, headers: corsHeaders });
      }

      const isValid = await verifySignature(body, signature, appSecret);
      if (!isValid) {
        console.error("Invalid signature");
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }

      const data = JSON.parse(body);
      // Don't log full webhook data - only log processing status

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process messaging events
      if (data.object === "page" && data.entry) {
        for (const entry of data.entry) {
          const messaging = entry.messaging || [];

          for (const event of messaging) {
            const senderId = event.sender?.id;
            const messageText = event.message?.text;
            const messageId = event.message?.mid;

            if (!senderId || !messageText) {
              console.log("Skipping event without sender or message text");
              continue;
            }

            // Log message received without exposing content
            console.log("Processing message from sender (ID hidden for privacy)");

            // Find or create conversation
            const { data: existingConversation, error: convError } = await supabase
              .from("messenger_conversations")
              .select("*")
              .eq("facebook_user_id", senderId)
              .single();

            let conversation = existingConversation;

            if (convError && convError.code === "PGRST116") {
              // Conversation doesn't exist, create one
              // Resolve organization from the Facebook Page ID in the webhook entry
              const pageId = entry.id;

              if (!pageId) {
                console.error("Missing page ID in webhook entry - cannot determine organization");
                continue;
              }

              // Look up organization by Facebook Page ID from integrations
              const { data: integration, error: integrationError } = await supabase
                .from("external_integrations")
                .select("organization_id")
                .eq("service_name", "facebook_messenger")
                .eq("is_active", true)
                .filter("config->>page_id", "eq", pageId)
                .single();

              if (integrationError || !integration?.organization_id) {
                console.error("No active Facebook Messenger integration found for this page");
                continue;
              }

              const orgId = integration.organization_id;

              const { data: newConv, error: createError } = await supabase
                .from("messenger_conversations")
                .insert({
                  facebook_user_id: senderId,
                  facebook_user_name: event.sender?.name || "Facebook User",
                  organization_id: orgId,
                  status: "active",
                  last_message_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (createError) {
                console.error("Error creating conversation:", createError);
                continue;
              }
              conversation = newConv;
              console.log("Created new conversation:", conversation.id);
            } else if (convError) {
              console.error("Error finding conversation:", convError);
              continue;
            } else {
              // Update last_message_at
              await supabase
                .from("messenger_conversations")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", conversation.id);
            }

            // Store the message
            const { error: msgError } = await supabase.from("messenger_messages").insert({
              conversation_id: conversation.id,
              direction: "inbound",
              content: messageText,
              message_type: "text",
              facebook_message_id: messageId,
            });

            if (msgError) {
              console.error("Error storing message:", msgError);
            } else {
              console.log("Message stored successfully");
            }
          }
        }
      }

      // Facebook requires a 200 response within 20 seconds
      return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    // Use safe error handler to prevent leaking sensitive information
    const safeError = safeErrorHandler(error, "facebook-messenger-webhook");
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
