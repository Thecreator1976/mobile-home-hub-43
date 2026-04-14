import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const LOOP_API_KEY = Deno.env.get("LOOP_API_KEY");
const APP_URL = Deno.env.get("APP_URL");

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

function getBaseAppUrl(req: Request) {
  const origin = req.headers.get("origin");
  const fallbackUrl = "https://mobilehomecrm.lovable.app";

  return APP_URL || origin || fallbackUrl;
}

function getRoleName(role: string) {
  if (role === "tenant_admin") return "Tenant Admin";
  if (role === "admin") return "Admin";
  if (role === "agent") return "Agent";
  if (role === "viewer") return "Viewer";
  if (role === "super_admin") return "Super Admin";
  return role;
}

function getRoleDescription(role: string) {
  if (role === "tenant_admin") {
    return `
      <li>Manage your organization and team members</li>
      <li>Oversee seller leads, buyers, and appointments</li>
      <li>Review contracts, expenses, and reports</li>
      <li>Control operational settings for your organization</li>
    `;
  }

  if (role === "admin") {
    return `
      <li>Manage users and permissions for your organization</li>
      <li>Access seller leads, buyers, appointments, and contracts</li>
      <li>Review financial and operational data</li>
      <li>Configure CRM settings and workflows</li>
    `;
  }

  if (role === "agent") {
    return `
      <li>Manage seller leads and buyers</li>
      <li>Schedule and track appointments</li>
      <li>Update lead statuses and offers</li>
      <li>Work day-to-day CRM records</li>
    `;
  }

  return `
    <li>View CRM records assigned to your role</li>
    <li>Review leads, buyers, and operational information</li>
    <li>Access shared organization data as permitted</li>
    <li>Use the CRM in a read-only or limited-access mode</li>
  `;
}

function getRoleDescriptionText(role: string) {
  if (role === "tenant_admin") {
    return [
      "- Manage your organization and team members",
      "- Oversee seller leads, buyers, and appointments",
      "- Review contracts, expenses, and reports",
      "- Control operational settings for your organization",
    ].join("\n");
  }

  if (role === "admin") {
    return [
      "- Manage users and permissions for your organization",
      "- Access seller leads, buyers, appointments, and contracts",
      "- Review financial and operational data",
      "- Configure CRM settings and workflows",
    ].join("\n");
  }

  if (role === "agent") {
    return [
      "- Manage seller leads and buyers",
      "- Schedule and track appointments",
      "- Update lead statuses and offers",
      "- Work day-to-day CRM records",
    ].join("\n");
  }

  return [
    "- View CRM records assigned to your role",
    "- Review leads, buyers, and operational information",
    "- Access shared organization data as permitted",
    "- Use the CRM in a read-only or limited-access mode",
  ].join("\n");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration is incomplete" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, organization_id, organization_name, role }: InvitationRequest =
      await req.json();

    console.log("Creating invitation for org:", organization_name, "as role:", role);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "A user with this email already exists" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: existingInvite } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "A pending invitation already exists for this email" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

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

    if (inviteError || !invitation) {
      console.error("Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError?.message || "Failed to create invitation" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Invitation created:", { id: invitation.id, role: invitation.role });

    const baseAppUrl = getBaseAppUrl(req);
    const inviteUrl = `${baseAppUrl.replace(/\/$/, "")}/accept-invite?token=${invitation.token}`;
    const roleName = getRoleName(role);

    if (!LOOP_API_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          invitation_id: invitation.id,
          warning: "Invitation created but email service is not configured. Share the link manually.",
          invite_url: inviteUrl,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const loopResponse = await fetch("https://api.loop.email/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "noreply@carolinasmobilehomemarket.org",
          name: "MobileHome CRM",
        },
        to: [{ email }],
        subject: `You're invited to join ${organization_name}`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px;">🏠</span>
              </div>
              <h1 style="margin: 0; color: #1f2937;">You're Invited</h1>
              <p style="color: #6b7280; margin-top: 10px;">Join ${organization_name} on MobileHome CRM</p>
            </div>

            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px;">
                You've been invited to join <strong style="color: #2563eb;">${organization_name}</strong>
                as a <strong style="color: #2563eb;">${roleName}</strong>.
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Use the button below to create your account and finish setup.
              </p>

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
                  Accept Invitation
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                This link expires in 7 days
              </p>
            </div>

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

            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">What you can do as ${roleName}:</h3>
              <ul style="color: #6b7280; padding-left: 20px; margin-bottom: 0;">
                ${getRoleDescription(role)}
              </ul>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                <strong>MobileHome CRM</strong><br>
                Invitation-only CRM access
              </p>

              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                If you received this email in error, you can ignore it.
              </p>
            </div>
          </body>
        </html>
        `,
        text: `
You've been invited to join ${organization_name} as ${roleName} on MobileHome CRM.

Accept your invitation here:
${inviteUrl}

This link expires in 7 days.

What you can do as ${roleName}:
${getRoleDescriptionText(role)}

MobileHome CRM
Invitation-only CRM access

If you received this email in error, you can ignore it.
        `,
      }),
    });

    if (!loopResponse.ok) {
      const loopError = await loopResponse.text();
      console.error("Error sending email via Loop:", loopError);

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
        }
      );
    }

    console.log("Invitation email sent successfully via Loop");

    return new Response(
      JSON.stringify({
        success: true,
        invitation_id: invitation.id,
        message: "Invitation sent successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-invitation function:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};

serve(handler);
