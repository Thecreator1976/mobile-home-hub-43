import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface WebhookPayload {
  event: string;
  lead?: any;
  old_status?: string;
  new_status?: string;
  timestamp: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    console.log("Authenticated user:", userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event, lead, old_status, new_status } = await req.json();
    console.log(`Processing webhook trigger for event: ${event}`);

    // Get active integrations that should be triggered for this event
    let serviceNames: string[] = [];
    
    if (event === "new_lead") {
      serviceNames = ["new_lead_notification", "openphone"];
    } else if (event === "status_change") {
      serviceNames = ["status_change", "openphone"];
    }

    const { data: integrations, error: intError } = await supabase
      .from("external_integrations")
      .select("*")
      .in("service_name", serviceNames)
      .eq("is_active", true);

    if (intError) {
      console.error("Error fetching integrations:", intError);
      throw intError;
    }

    console.log(`Found ${integrations?.length || 0} active integrations to trigger`);

    const results = [];

    for (const integration of integrations || []) {
      if (!integration.webhook_url) continue;

      const payload: WebhookPayload = {
        event,
        lead: lead ? {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          asking_price: lead.asking_price,
          home_type: lead.home_type,
          status: lead.status,
        } : undefined,
        old_status,
        new_status,
        timestamp: new Date().toISOString(),
        source: "mobilehome_crm",
      };

      try {
        console.log(`Triggering webhook for ${integration.service_name}: ${integration.webhook_url}`);
        
        const response = await fetch(integration.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Update last_sync timestamp
        await supabase
          .from("external_integrations")
          .update({ last_sync: new Date().toISOString() })
          .eq("id", integration.id);

        results.push({
          service: integration.service_name,
          success: response.ok,
          status: response.status,
        });

        console.log(`Webhook ${integration.service_name} responded with status: ${response.status}`);
      } catch (err) {
        console.error(`Error triggering ${integration.service_name}:`, err);
        results.push({
          service: integration.service_name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in trigger-webhooks:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Handle authentication errors
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
