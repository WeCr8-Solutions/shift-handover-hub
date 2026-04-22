// Seed E2E test fixtures (admin + operator users, org, team, station, work order)
// SECURITY: Requires E2E_SEED_SECRET header. Disabled in production unless explicitly enabled.
// Idempotent: re-running returns the same IDs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-e2e-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEED_SECRET = Deno.env.get("E2E_SEED_SECRET") ?? "";

// Fixed fixture identifiers
const ADMIN_EMAIL = "admin-e2e@jobline.test";
const OPERATOR_EMAIL = "operator-e2e@jobline.test";
const ADMIN_PASSWORD = Deno.env.get("E2E_ADMIN_PASSWORD") ?? "E2eAdmin!Pass2026";
const OPERATOR_PASSWORD = Deno.env.get("E2E_OPERATOR_PASSWORD") ?? "E2eOperator!Pass2026";
const ORG_SLUG = "e2e-shop";
const STATION_ID_CODE = "E2E-CNC-01";

async function getOrCreateUser(admin: any, email: string, password: string, displayName: string) {
  const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
  const headers = {
    "Authorization": `Bearer ${SERVICE_ROLE}`,
    "apikey": SERVICE_ROLE,
    "Content-Type": "application/json",
  };

  async function findByEmail(): Promise<{ id: string; email: string } | null> {
    // Use SQL helper RPC (auth admin REST listing is unreliable)
    const { data, error } = await admin.rpc("get_auth_user_id_by_email", { _email: email });
    if (error) {
      console.error("get_auth_user_id_by_email error", error);
      return null;
    }
    if (data) return { id: data as string, email };
    return null;
  }

  // 1. Try create first
  const createRes = await fetch(adminUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    }),
  });
  if (createRes.ok) {
    return (await createRes.json()) as { id: string; email: string };
  }
  const errText = await createRes.text();
  // 2. If exists, find and update password
  if (/email[_ ]?exists|already|registered/i.test(errText)) {
    const found = await findByEmail();
    if (found) {
      await fetch(`${adminUrl}/${found.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ password }),
      });
      return found;
    }
  }
  throw new Error(`Failed to provision user ${email}: ${errText}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth: accept either the seed secret header OR a platform-admin JWT.
    const provided = req.headers.get("x-e2e-secret");
    let authorized = !!SEED_SECRET && provided === SEED_SECRET;

    if (!authorized) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
          const userClient = createClient(
            SUPABASE_URL,
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } },
          );
          const { data: userData } = await userClient.auth.getUser(token);
          const uid = userData?.user?.id as string | undefined;
          if (uid) {
            // Check platform admin role via has_role security-definer fn.
            const { data: isAdmin } = await admin.rpc("has_role", {
              _user_id: uid,
              _role: "admin",
            });
            if (isAdmin === true) authorized = true;
          }
        } catch (e) {
          console.error("seed-e2e jwt check failed", e);
        }
      }
    }

    if (!authorized) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 1. Users
    const adminUser = await getOrCreateUser(admin, ADMIN_EMAIL, ADMIN_PASSWORD, "E2E Admin");
    const operatorUser = await getOrCreateUser(admin, OPERATOR_EMAIL, OPERATOR_PASSWORD, "E2E Operator");

    // 2. Profiles (upsert)
    await admin.from("profiles").upsert(
      [
        { user_id: adminUser.id, email: ADMIN_EMAIL, display_name: "E2E Admin" },
        { user_id: operatorUser.id, email: OPERATOR_EMAIL, display_name: "E2E Operator" },
      ],
      { onConflict: "user_id" },
    );

    // 3. Organization
    let { data: org } = await admin
      .from("organizations")
      .select("*")
      .eq("slug", ORG_SLUG)
      .maybeSingle();
    if (!org) {
      const { data: created, error: orgErr } = await admin
        .from("organizations")
        .insert({
          name: "E2E Test Shop",
          slug: ORG_SLUG,
          description: "Automated E2E fixture org",
          created_by: adminUser.id,
          subscription_tier: "team",
          subscription_status: "active",
        })
        .select()
        .single();
      if (orgErr) throw orgErr;
      org = created;
    }

    // 4. Org members
    await admin.from("organization_members").upsert(
      [
        { organization_id: org!.id, user_id: adminUser.id, role: "owner" },
        { organization_id: org!.id, user_id: operatorUser.id, role: "member" },
      ],
      { onConflict: "organization_id,user_id" },
    );

    // 5. App role for operator
    await admin.from("user_roles").upsert(
      [
        { user_id: operatorUser.id, role: "operator" },
        { user_id: adminUser.id, role: "supervisor" },
      ],
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // 6. Team
    let { data: team } = await admin
      .from("teams")
      .select("*")
      .eq("organization_id", org!.id)
      .eq("name", "E2E Day Shift")
      .maybeSingle();
    if (!team) {
      const { data: createdTeam, error: teamErr } = await admin
        .from("teams")
        .insert({
          organization_id: org!.id,
          name: "E2E Day Shift",
          description: "E2E fixture team",
          created_by: adminUser.id,
        })
        .select()
        .single();
      if (teamErr) throw teamErr;
      team = createdTeam;
    }

    // 7. Team members
    await admin.from("team_members").upsert(
      [
        { team_id: team!.id, user_id: adminUser.id, role: "owner" },
        { team_id: team!.id, user_id: operatorUser.id, role: "member" },
      ],
      { onConflict: "team_id,user_id" },
    );

    // 8. Station
    let { data: station } = await admin
      .from("stations")
      .select("*")
      .eq("organization_id", org!.id)
      .eq("station_id", STATION_ID_CODE)
      .maybeSingle();
    if (!station) {
      const { data: createdStation, error: stationErr } = await admin
        .from("stations")
        .insert({
          organization_id: org!.id,
          team_id: team!.id,
          station_id: STATION_ID_CODE,
          name: "E2E CNC Mill 01",
          work_center: "CNC Mill",
          work_center_type: "milling",
          is_active: true,
        })
        .select()
        .single();
      if (stationErr) throw stationErr;
      station = createdStation;
    }

    // 9. Work order (idempotent by work_order code)
    const woCode = "E2E-WO-001";
    let { data: wo } = await admin
      .from("queue_items")
      .select("*")
      .eq("organization_id", org!.id)
      .eq("work_order", woCode)
      .maybeSingle();
    if (!wo) {
      const { data: createdWo, error: woErr } = await admin
        .from("queue_items")
        .insert({
          organization_id: org!.id,
          team_id: team!.id,
          station_id: station!.id,
          item_type: "work_order",
          title: "E2E Test Bracket",
          work_order: woCode,
          part_number: "BRK-E2E-001",
          operation_number: "OP10",
          quantity: 5,
          qty_original: 5,
          qty_open: 5,
          qty_completed: 0,
          priority: "normal",
          status: "queued",
          created_by: adminUser.id,
          assigned_to: operatorUser.id,
          estimated_duration: 30,
        })
        .select()
        .single();
      if (woErr) throw woErr;
      wo = createdWo;
    } else {
      // Reset to a clean queued state for repeatable runs
      await admin
        .from("queue_items")
        .update({
          status: "queued",
          qty_completed: 0,
          qty_open: 5,
          qty_scrap: 0,
          qty_rework: 0,
          started_at: null,
        })
        .eq("id", wo.id);
    }

    return json({
      ok: true,
      admin: { id: adminUser.id, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      operator: { id: operatorUser.id, email: OPERATOR_EMAIL, password: OPERATOR_PASSWORD },
      organization: { id: org!.id, slug: org!.slug, name: org!.name },
      team: { id: team!.id, name: team!.name },
      station: { id: station!.id, station_id: station!.station_id, name: station!.name },
      work_order: { id: wo!.id, code: woCode },
    });
  } catch (e) {
    console.error("seed-e2e error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
