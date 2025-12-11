import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

// HMAC-SHA256 signature verification
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const expectedSignature = `sha256=${hashHex}`;
  return signature === expectedSignature;
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
        console.error("FACEBOOK_VERIFY_TOKEN not configured");
        return new Response("Webhook not configured", { status: 500, headers: corsHeaders });
      }

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200, headers: corsHeaders });
      } else {
        console.error("Verification failed. Mode:", mode, "Token match:", token === verifyToken);
        return new Response("Verification failed", { status: 403, headers: corsHeaders });
      }
    }

    // POST request: Handle incoming messages
    if (req.method === "POST") {
      const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
      
      if (!appSecret) {
        console.error("FACEBOOK_APP_SECRET not configured");
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
      console.log("Received webhook data:", JSON.stringify(data, null, 2));

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

            console.log(`Processing message from ${senderId}: ${messageText}`);

            // Find or create conversation
            let { data: conversation, error: convError } = await supabase
              .from("messenger_conversations")
              .select("*")
              .eq("facebook_user_id", senderId)
              .single();

            if (convError && convError.code === "PGRST116") {
              // Conversation doesn't exist, create one
              const { data: newConv, error: createError } = await supabase
                .from("messenger_conversations")
                .insert({
                  facebook_user_id: senderId,
                  facebook_user_name: event.sender?.name || "Facebook User",
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
            const { error: msgError } = await supabase
              .from("messenger_messages")
              .insert({
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
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
