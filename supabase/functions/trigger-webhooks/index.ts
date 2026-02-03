import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import {
  validateString,
  validateEnum,
  validateFields,
  validationErrorResponse,
  MAX_LENGTHS,
} from "../_shared/validation.ts";

interface WebhookPayload {
  event: string;
  lead?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    asking_price?: number;
    home_type?: string;
    status?: string;
  };
  old_status?: string;
  new_status?: string;
  timestamp: string;
  source: string;
}

interface WebhookRequest {
  event: string;
  lead?: Record<string, unknown>;
  old_status?: string;
  new_status?: string;
}

function validateWebhookRequest(data: unknown): { valid: boolean; errors: string[]; sanitized?: WebhookRequest } {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body is required"] };
  }

  const req = data as Record<string, unknown>;

  const validation = validateFields([
    { result: validateEnum(req.event, "Event", ["new_lead", "status_change"] as const, true), field: "event" },
    { result: validateString(req.old_status, "Old status", { maxLength: 50 }), field: "old_status" },
    { result: validateString(req.new_status, "New status", { maxLength: 50 }), field: "new_status" },
  ]);

  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  // Validate lead data if present
  let sanitizedLead: Record<string, unknown> | undefined;
  if (req.lead && typeof req.lead === "object") {
    const lead = req.lead as Record<string, unknown>;
    const leadValidation = validateFields([
      { result: validateString(lead.id, "Lead ID", { maxLength: 100 }), field: "id" },
      { result: validateString(lead.name, "Name", { maxLength: MAX_LENGTHS.name }), field: "name" },
      { result: validateString(lead.phone, "Phone", { maxLength: MAX_LENGTHS.phone }), field: "phone" },
      { result: validateString(lead.email, "Email", { maxLength: MAX_LENGTHS.email }), field: "email" },
      { result: validateString(lead.address, "Address", { maxLength: MAX_LENGTHS.address }), field: "address" },
      { result: validateString(lead.city, "City", { maxLength: 100 }), field: "city" },
      { result: validateString(lead.state, "State", { maxLength: 50 }), field: "state" },
      { result: validateString(lead.home_type, "Home type", { maxLength: 50 }), field: "home_type" },
      { result: validateString(lead.status, "Status", { maxLength: 50 }), field: "status" },
    ]);

    if (!leadValidation.valid) {
      return { valid: false, errors: leadValidation.errors };
    }

    sanitizedLead = leadValidation.sanitized;
    
    // Handle asking_price separately (number validation)
    if (lead.asking_price !== undefined) {
      const price = Number(lead.asking_price);
      if (isNaN(price) || price < 0 || price > 100000000) {
        return { valid: false, errors: ["Asking price must be between 0 and 100,000,000"] };
      }
      sanitizedLead.asking_price = price;
    }
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      event: validation.sanitized.event as string,
      lead: sanitizedLead,
      old_status: validation.sanitized.old_status as string | undefined,
      new_status: validation.sanitized.new_status as string | undefined,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    console.log("Authenticated user:", userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawData = await req.json();
    const validation = validateWebhookRequest(rawData);

    if (!validation.valid || !validation.sanitized) {
      console.error("Validation errors:", validation.errors);
      return validationErrorResponse(validation.errors, corsHeaders);
    }

    const { event, lead, old_status, new_status } = validation.sanitized;
    console.log(`Processing webhook trigger for event: ${event}`);

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
          id: lead.id as string,
          name: lead.name as string,
          phone: lead.phone as string | undefined,
          email: lead.email as string | undefined,
          address: lead.address as string | undefined,
          city: lead.city as string | undefined,
          state: lead.state as string | undefined,
          asking_price: lead.asking_price as number | undefined,
          home_type: lead.home_type as string | undefined,
          status: lead.status as string | undefined,
        } : undefined,
        old_status,
        new_status,
        timestamp: new Date().toISOString(),
        source: "mobilehome_crm",
      };

      try {
        console.log(`Triggering webhook for ${integration.service_name}`);
        
        const response = await fetch(integration.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

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
    
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
