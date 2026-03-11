import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { machine_library_id, organization_id } = body ?? {};
    if (!machine_library_id || !organization_id) {
      return new Response(
        JSON.stringify({
          error: "machine_library_id and organization_id required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = data.user;

    // Verify user is org member
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (membershipError) {
      console.error("Membership check error:", membershipError);
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: "Access denied: not an org member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already purchased
    const { data: existing, error: existingError } = await supabase
      .from("organization_machine_purchases")
      .select("id, is_active")
      .eq("organization_id", organization_id)
      .eq("machine_library_id", machine_library_id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing purchase:", existingError);
    }

    if (existing?.is_active) {
      return new Response(JSON.stringify({ activated: true, already_owned: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payment configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Search for completed checkout sessions
    const sessions = await stripe.checkout.sessions.list({ limit: 20 });
    const matchingSession = sessions.data.find(
      (s: any) =>
        s.metadata?.machine_library_id === machine_library_id &&
        s.metadata?.organization_id === organization_id &&
        s.metadata?.type === "machine_library_purchase" &&
        s.payment_status === "paid",
    );

    if (!matchingSession) {
      return new Response(JSON.stringify({ activated: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("organization_machine_purchases").insert({
      organization_id,
      machine_library_id,
      purchased_by: user.id,
      stripe_payment_id: matchingSession.payment_intent as string,
      is_active: true,
    });

    if (error) {
      // Might be a duplicate - check if already exists
      if ((error as any).code === "23505") {
        return new Response(JSON.stringify({ activated: true, already_owned: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Insert error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ activated: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("activate-station-context error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
