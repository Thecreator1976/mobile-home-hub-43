import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface NotificationRequest {
  contract_id: string;
  event: "signed" | "sent" | "expired" | "voided";
  recipient_email?: string;
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { contract_id, event, recipient_email }: NotificationRequest = await req.json();
    console.log(`Processing contract notification: ${event}`);

    // Fetch contract details with lead info
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        seller_lead:seller_leads(id, name, address, city, state, email, phone)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      console.error("Error fetching contract:", contractError);
      throw new Error("Contract not found");
    }

    // Get the user who created the contract
    let notificationEmail = recipient_email;
    if (!notificationEmail && contract.created_by) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", contract.created_by)
        .single();
      
      notificationEmail = profile?.email;
    }

    if (!notificationEmail) {
      console.log("No recipient email found, skipping notification");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email content based on event
    let subject = "";
    let htmlContent = "";
    const leadName = contract.seller_lead?.name || "Unknown";
    const propertyAddress = contract.seller_lead?.address || "Unknown address";

    switch (event) {
      case "signed":
        subject = `🎉 Contract Signed - ${leadName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Contract Signed!</h1>
            <p>Great news! The contract for <strong>${leadName}</strong> has been signed.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #166534;">Contract Details</h3>
              <p style="margin: 4px 0;"><strong>Template:</strong> ${contract.template_name}</p>
              <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
              <p style="margin: 4px 0;"><strong>Signed at:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>You can view the full contract details in your CRM dashboard.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              This is an automated notification from MobileHome CRM.
            </p>
          </div>
        `;
        break;

      case "sent":
        subject = `📤 Contract Sent - ${leadName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Contract Sent</h1>
            <p>A contract for <strong>${leadName}</strong> has been sent for signature.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1d4ed8;">Contract Details</h3>
              <p style="margin: 4px 0;"><strong>Template:</strong> ${contract.template_name}</p>
              <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              This is an automated notification from MobileHome CRM.
            </p>
          </div>
        `;
        break;

      case "expired":
        subject = `⚠️ Contract Expired - ${leadName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Contract Expired</h1>
            <p>The contract for <strong>${leadName}</strong> has expired.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
            </div>
            <p>You may want to regenerate a new contract or follow up with the lead.</p>
          </div>
        `;
        break;

      case "voided":
        subject = `❌ Contract Voided - ${leadName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Contract Voided</h1>
            <p>The contract for <strong>${leadName}</strong> has been voided.</p>
            <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
            </div>
          </div>
        `;
        break;
    }

    console.log(`Sending ${event} notification to ${notificationEmail}`);

    const emailResponse = await resend.emails.send({
      from: "MobileHome CRM <onboarding@resend.dev>",
      to: [notificationEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-contract-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Handle authentication errors
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
