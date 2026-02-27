import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { machine_library_id, organization_id } = await req.json();
    if (!machine_library_id || !organization_id) throw new Error("machine_library_id and organization_id required");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    if (!data.user) throw new Error("Not authenticated");

    // Check if already purchased
    const { data: existing } = await supabase
      .from("organization_machine_purchases")
      .select("id, is_active")
      .eq("organization_id", organization_id)
      .eq("machine_library_id", machine_library_id)
      .maybeSingle();

    if (existing?.is_active) {
      return new Response(
        JSON.stringify({ activated: true, already_owned: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Search for completed checkout sessions
    const sessions = await stripe.checkout.sessions.list({ limit: 20 });
    const matchingSession = sessions.data.find(
      (s) =>
        s.metadata?.machine_library_id === machine_library_id &&
        s.metadata?.organization_id === organization_id &&
        s.metadata?.type === "machine_library_purchase" &&
        s.payment_status === "paid"
    );

    if (!matchingSession) {
      return new Response(
        JSON.stringify({ activated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create the purchase record
    const { error } = await supabase
      .from("organization_machine_purchases")
      .insert({
        organization_id,
        machine_library_id,
        purchased_by: data.user.id,
        stripe_payment_id: matchingSession.payment_intent as string,
        is_active: true,
      });

    if (error) {
      // Might be a duplicate - check if already exists
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ activated: true, already_owned: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ activated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
