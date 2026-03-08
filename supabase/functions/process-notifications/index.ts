import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-NOTIFICATIONS] ${step}${detailsStr}`);
};

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

// Exponential backoff: 1min, 5min, 15min, 60min, 240min
function getBackoffMinutes(attempt: number): number {
  const backoffs = [1, 5, 15, 60, 240];
  return backoffs[Math.min(attempt, backoffs.length - 1)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Auth check: only service-role, admins, or developers can trigger
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        const { data: isAdmin } = await supabaseAdmin.rpc("is_dev_or_admin", {
          _user_id: userData.user.id,
        });
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin or developer access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        logStep("Authorized via user token", { userId: userData.user.id });
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("ERROR: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Fetch pending notifications that are ready to send
    const { data: pending, error: fetchError } = await supabaseAdmin
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logStep("ERROR fetching queue", { error: fetchError.message });
      throw fetchError;
    }

    if (!pending || pending.length === 0) {
      logStep("No pending notifications");
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Processing batch", { count: pending.length });

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        // Mark as processing
        await supabaseAdmin
          .from("notification_queue")
          .update({
            status: "processing",
            last_attempt_at: new Date().toISOString(),
            attempts: (notification.attempts || 0) + 1,
          })
          .eq("id", notification.id);

        if (notification.channel === "email") {
          // Rate check: max 10 emails/hour to same recipient
          const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
          const { count: recentCount } = await supabaseAdmin
            .from("notification_queue")
            .select("id", { count: "exact", head: true })
            .eq("recipient", notification.recipient)
            .eq("status", "sent")
            .gte("sent_at", oneHourAgo);

          if ((recentCount || 0) >= 10) {
            logStep("Rate limited", { recipient: notification.recipient });
            // Reschedule with backoff
            const backoffMin = getBackoffMinutes(notification.attempts || 0);
            await supabaseAdmin
              .from("notification_queue")
              .update({
                status: "pending",
                scheduled_for: new Date(Date.now() + backoffMin * 60_000).toISOString(),
                error_message: `Rate limited. Rescheduled +${backoffMin}min`,
              })
              .eq("id", notification.id);
            continue;
          }

          // Build severity color for issue notifications
          const metadata = notification.metadata as Record<string, unknown> | null;
          const severity = (metadata?.severity as string) || "medium";
          const severityColors: Record<string, string> = {
            critical: "#dc2626",
            high: "#ea580c",
            medium: "#ca8a04",
            low: "#16a34a",
          };

          const { error: sendError } = await resend.emails.send({
            from: "JobLine Alerts <noreply@joblineai.com>",
            to: [notification.recipient],
            subject: notification.subject || "JobLine Notification",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: #fff; margin: 0; font-size: 18px;">🔔 ${notification.notification_type === 'issue_reported' ? '🐛 New Issue Reported' : 'Notification'}</h2>
                </div>
                <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                  ${severity ? `
                    <div style="background: ${severityColors[severity] || '#ca8a04'}22; border-left: 4px solid ${severityColors[severity] || '#ca8a04'}; padding: 10px; margin-bottom: 14px; border-radius: 4px;">
                      <span style="color: ${severityColors[severity] || '#ca8a04'}; font-weight: 600; text-transform: uppercase; font-size: 11px;">${severity}</span>
                    </div>
                  ` : ''}
                  <p style="color: #1e293b; margin: 0; white-space: pre-line; line-height: 1.6;">${notification.content}</p>
                  ${metadata?.reporter_email ? `
                    <p style="color: #64748b; font-size: 13px; margin-top: 12px;">Reporter: ${metadata.reporter_email}</p>
                  ` : ''}
                </div>
              </div>
            `,
          });

          if (sendError) {
            throw new Error(`Resend error: ${JSON.stringify(sendError)}`);
          }

          // Mark as sent
          await supabaseAdmin
            .from("notification_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", notification.id);

          logStep("Sent", { id: notification.id, to: notification.recipient });
          sent++;
        } else {
          // Unsupported channel — mark as failed
          await supabaseAdmin
            .from("notification_queue")
            .update({
              status: "failed",
              error_message: `Unsupported channel: ${notification.channel}`,
            })
            .eq("id", notification.id);
          failed++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logStep("Send failed", { id: notification.id, error: errorMsg });

        const newAttempts = (notification.attempts || 0) + 1;
        const isFinal = newAttempts >= MAX_ATTEMPTS;
        const backoffMin = getBackoffMinutes(newAttempts);

        await supabaseAdmin
          .from("notification_queue")
          .update({
            status: isFinal ? "failed" : "pending",
            error_message: errorMsg,
            scheduled_for: isFinal
              ? undefined
              : new Date(Date.now() + backoffMin * 60_000).toISOString(),
          })
          .eq("id", notification.id);

        failed++;
      }
    }

    const result = { processed: pending.length, sent, failed };
    logStep("Batch complete", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
