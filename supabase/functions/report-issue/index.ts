import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IssueReport {
  title: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  error_message?: string;
  error_stack?: string;
  console_logs?: unknown[];
  page_url?: string;
  metadata?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Create clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: IssueReport = await req.json();

    // Get user profile for display name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    // Get user's organization (if any)
    const { data: orgMember } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    // Production context from environment
    const productionContext = {
      environment: Deno.env.get("ENVIRONMENT") || "production",
      app_version: body.metadata?.app_version || "1.0.0",
      build_id: body.metadata?.build_id || Deno.env.get("BUILD_ID") || "unknown",
      commit_hash: body.metadata?.commit_hash || Deno.env.get("COMMIT_HASH") || "unknown",
    };

    // Insert the issue
    const { data: issue, error: insertError } = await supabaseAdmin
      .from("issues")
      .insert({
        reporter_id: user.id,
        reporter_email: user.email,
        reporter_display_name: profile?.display_name || user.email?.split("@")[0],
        title: body.title,
        description: body.description,
        severity: body.severity || "medium",
        error_message: body.error_message,
        error_stack: body.error_stack,
        console_logs: body.console_logs || [],
        page_url: body.page_url,
        user_agent: req.headers.get("User-Agent"),
        organization_id: orgMember?.organization_id,
        ...productionContext,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting issue:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create issue" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Issue created:", issue.id);

    // Send email notification to admins/developers
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Get admin/developer emails
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "developer"]);

      if (adminRoles && adminRoles.length > 0) {
        const userIds = adminRoles.map((r) => r.user_id);
        const { data: adminProfiles } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .in("user_id", userIds)
          .not("email", "is", null);

        const adminEmails = adminProfiles?.map((p) => p.email).filter(Boolean) as string[];

        if (adminEmails.length > 0) {
          try {
            const severityColors: Record<string, string> = {
              critical: "#dc2626",
              high: "#ea580c",
              medium: "#ca8a04",
              low: "#16a34a",
            };

            await resend.emails.send({
              from: "JobLine Issues <noreply@joblineai.com>",
              to: adminEmails.slice(0, 10), // Limit to 10 recipients
              subject: `[${issue.severity.toUpperCase()}] New Issue: ${issue.title}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 20px;">🐛 New Issue Reported</h1>
                  </div>
                  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <div style="background: ${severityColors[issue.severity]}22; border-left: 4px solid ${severityColors[issue.severity]}; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
                      <span style="color: ${severityColors[issue.severity]}; font-weight: 600; text-transform: uppercase; font-size: 12px;">${issue.severity}</span>
                    </div>
                    
                    <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 18px;">${issue.title}</h2>
                    ${issue.description ? `<p style="color: #64748b; margin: 0 0 16px 0;">${issue.description}</p>` : ""}
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Reporter</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${issue.reporter_display_name} (${issue.reporter_email})</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Page URL</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${issue.page_url || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Environment</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${issue.environment}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Build</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${issue.build_id} / ${issue.commit_hash}</td>
                      </tr>
                    </table>

                    ${issue.error_message ? `
                    <div style="margin-top: 16px;">
                      <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 14px;">Error Message</h3>
                      <pre style="background: #1e293b; color: #f1f5f9; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${issue.error_message}</pre>
                    </div>
                    ` : ""}
                    
                    <div style="margin-top: 24px; text-align: center;">
                      <a href="${supabaseUrl.replace('.supabase.co', '')}/admin#issues" 
                         style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                        View in Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              `,
            });
            console.log("Email notification sent to:", adminEmails);
          } catch (emailError) {
            console.error("Failed to send email notification:", emailError);
            // Don't fail the request if email fails
          }
        }
      }
    }

    // Webhook notification (if configured)
    const webhookUrl = Deno.env.get("ISSUES_WEBHOOK_URL");
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "issue.created",
            issue: {
              id: issue.id,
              title: issue.title,
              severity: issue.severity,
              reporter: issue.reporter_display_name,
              page_url: issue.page_url,
              error_message: issue.error_message,
              created_at: issue.created_at,
            },
          }),
        });
        console.log("Webhook notification sent");
      } catch (webhookError) {
        console.error("Failed to send webhook notification:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, issue_id: issue.id }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in report-issue function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
