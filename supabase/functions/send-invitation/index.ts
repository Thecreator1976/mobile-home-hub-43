import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

// Get environment variables
const LOOP_API_KEY = Deno.env.get("LOOP_API_KEY");

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

    // Send invitation email using Loop API
    const loopResponse = await fetch("https://api.loop.email/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "noreply@carolinasmobilehomemarket.org",
          name: "Carolina's Mobile Home Market",
        },
        to: [{ email }],
        subject: `You're Invited to Join ${organization_name}`,
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
              <h1 style="margin: 0; color: #1f2937;">You're Invited!</h1>
              <p style="color: #6b7280; margin-top: 10px;">Join Carolina's Mobile Home Market CRM</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px;">
                You've been invited to join <strong style="color: #2563eb;">${organization_name}</strong> 
                as a <strong style="color: #2563eb;">${roleName}</strong> on Carolina's Mobile Home Market CRM.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                This platform helps manage mobile home listings, tenants, and properties efficiently.
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
                  🏡 Accept Invitation & Create Account
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                This link expires in 7 days
              </p>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px 0;">
                <strong>Alternative:</strong> Copy and paste this link:
              </p>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <code style="color: #3b82f6; font-size: 13px; word-break: break-all;">
                  ${inviteUrl}
                </code>
              </div>
            </div>
            
            <!-- What to Expect -->
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">What you can do as ${roleName}:</h3>
              <ul style="color: #6b7280; padding-left: 20px; margin-bottom: 0;">
                ${
                  role === "tenant_admin"
                    ? `<li>Manage multiple mobile home properties</li>
                   <li>Handle tenant applications and leases</li>
                   <li>Track maintenance requests</li>
                   <li>Generate reports and analytics</li>`
                    : role === "admin"
                      ? `<li>Full access to all CRM features</li>
                   <li>Manage team members and permissions</li>
                   <li>Configure property settings</li>
                   <li>View financial reports</li>`
                      : role === "agent"
                        ? `<li>Manage assigned properties</li>
                   <li>Communicate with tenants</li>
                   <li>Submit maintenance requests</li>
                   <li>View property analytics</li>`
                        : `<li>View assigned properties</li>
                   <li>Submit maintenance requests</li>
                   <li>Communicate with property managers</li>
                   <li>Access tenant resources</li>`
                }
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Carolina's Mobile Home Market CRM</strong><br>
                Professional mobile home management platform
              </p>
              
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This invitation was sent from: noreply@carolinasmobilehomemarket.org<br>
                For questions, please contact your organization administrator.
              </p>
              
              <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">
                If you received this email in error, please ignore it.
              </p>
            </div>
            
          </body>
        </html>
        `,
        // Optional: Add text version for email clients that don't support HTML
        text: `
You've been invited to join ${organization_name} as ${roleName} on Carolina's Mobile Home Market CRM.

Accept your invitation here: ${inviteUrl}

This link expires in 7 days.

What you can do as ${roleName}:
${
  role === "tenant_admin"
    ? "- Manage multiple mobile home properties\n- Handle tenant applications and leases\n- Track maintenance requests\n- Generate reports and analytics"
    : role === "admin"
      ? "- Full access to all CRM features\n- Manage team members and permissions\n- Configure property settings\n- View financial reports"
      : role === "agent"
        ? "- Manage assigned properties\n- Communicate with tenants\n- Submit maintenance requests\n- View property analytics"
        : "- View assigned properties\n- Submit maintenance requests\n- Communicate with property managers\n- Access tenant resources"
}

Carolina's Mobile Home Market CRM
Professional mobile home management platform

If you received this email in error, please ignore it.
        `,
      }),
    });

    if (!loopResponse.ok) {
      const loopError = await loopResponse.text();
      console.error("Error sending email via Loop:", loopError);

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

    console.log("Invitation email sent successfully via Loop");

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
  } catch (error: unknown) {
    console.error("Error in send-invitation function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
};

serve(handler);
