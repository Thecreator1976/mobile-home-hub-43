import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

// Get environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  organization_id: string | null;
  organization_name: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the JWT from the request header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Verify the user's JWT and get user ID
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const { email, organization_id, organization_name, role }: InvitationRequest = await req.json();

    // Log invitation request (without exposing email for privacy)
    console.log("Creating invitation for org:", organization_name, "as role:", role);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Check if user already exists with this email
    const { data: existingProfile } = await supabase.from("profiles").select("id, email").eq("email", email).single();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: "A user with this email already exists" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(JSON.stringify({ error: "A pending invitation already exists for this email" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        email,
        organization_id,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Log invitation created
    console.log("Invitation created:", { id: invitation.id, role: invitation.role });

    // Build the invitation URL
    const appUrl = req.headers.get("origin") || "https://mobilehomecrm.lovable.app";
    const inviteUrl = `${appUrl}/accept-invite?token=${invitation.token}`;

    // Determine role name for display
    const roleName =
      role === "tenant_admin" ? "Tenant Admin" : role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Viewer";

    // Send invitation email using Resend with YOUR DOMAIN
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Carolina's Mobile Home Market <noreply@carolinasmobilehomemarket.org>",
        to: [email],
        subject: `You've been invited to join ${organization_name} on Carolina's Mobile Home Market CRM`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px;">🏠</span>
              </div>
              <h1 style="margin: 0; color: #1f2937;">You're Invited to Carolina's Mobile Home Market!</h1>
            </div>
            
            <!-- Main Content -->
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px;">
                You've been invited to join <strong style="color: #2563eb;">${organization_name}</strong> 
                on Carolina's Mobile Home Market CRM as a <strong style="color: #2563eb;">${roleName}</strong>.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Click the button below to set up your account and get started managing mobile home listings:
              </p>
              
              <!-- Invitation Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                          color: white; 
                          text-decoration: none; 
                          padding: 14px 32px; 
                          border-radius: 8px; 
                          font-weight: 600; 
                          font-size: 16px;
                          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  🏡 Accept Invitation
                </a>
              </div>
            </div>
            
            <!-- Alternative Link -->
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
              <strong>Or copy and paste this link into your browser:</strong><br>
              <a href="${inviteUrl}" 
                 style="color: #3b82f6; 
                        word-break: break-all; 
                        font-size: 13px;
                        text-decoration: none;">
                ${inviteUrl}
              </a>
            </p>
            
            <!-- Expiration Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Important:</strong> This invitation link will expire in 7 days.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Carolina's Mobile Home Market CRM</strong><br>
                Professional mobile home listing management system
              </p>
              
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This email was sent from: noreply@carolinasmobilehomemarket.org<br>
                Website: https://carolinasmobilehomemarket.org
              </p>
              
              <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            
          </body>
        </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error("Error sending email:", emailError);

      // Don't fail the whole operation if email fails - invitation is still created
      return new Response(
        JSON.stringify({
          success: true,
          invitation_id: invitation.id,
          warning: "Invitation created but email could not be sent. Please share the link manually.",
          invite_url: inviteUrl,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("Invitation email sent successfully using Carolina's Mobile Home Market domain");

    return new Response(
      JSON.stringify({
        success: true,
        invitation_id: invitation.id,
        message: "Invitation sent successfully from Carolina's Mobile Home Market",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
};

serve(handler);
