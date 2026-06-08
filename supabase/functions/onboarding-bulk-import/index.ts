// Concierge onboarding CSV bulk import
// JWT-verified, gated to platform admin / developer roles.
// Body: { engagement_id, module_key, storage_path, dry_run }
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Row = Record<string, string>;
type Result = { inserted: number; skipped: number; errors: Array<{ row: number; message: string }> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Row = {};
    headers.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const required = (row: Row, keys: string[], idx: number, errs: Result["errors"]): boolean => {
  for (const k of keys) {
    if (!row[k] || row[k].length === 0) {
      errs.push({ row: idx + 2, message: `Missing required column "${k}"` });
      return false;
    }
  }
  return true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
    const isPlatform = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "developer");
    if (!isPlatform) return json({ error: "Forbidden" }, 403);

    const { engagement_id, module_key, storage_path, dry_run } = await req.json();
    if (!engagement_id || !module_key || !storage_path) return json({ error: "Missing fields" }, 400);

    const { data: eng, error: engErr } = await admin
      .from("onboarding_engagements")
      .select("id, organization_id")
      .eq("id", engagement_id)
      .maybeSingle();
    if (engErr || !eng) return json({ error: "Engagement not found" }, 404);
    const orgId = eng.organization_id;

    const { data: blob, error: dlErr } = await admin.storage.from("onboarding-documents").download(storage_path);
    if (dlErr || !blob) return json({ error: `Cannot read file: ${dlErr?.message}` }, 400);
    const text = await blob.text();
    const rows = parseCsv(text);
    if (rows.length === 0) return json({ inserted: 0, skipped: 0, errors: [{ row: 0, message: "No data rows" }] });

    const result: Result = { inserted: 0, skipped: 0, errors: [] };

    switch (module_key) {
      case "equipment": {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!required(r, ["asset_tag", "name", "equipment_type"], i, result.errors)) { result.skipped++; continue; }
          if (dry_run) { result.inserted++; continue; }
          const { error } = await admin.from("equipment").upsert(
            {
              organization_id: orgId,
              asset_tag: r.asset_tag,
              name: r.name,
              equipment_type: r.equipment_type,
              manufacturer: r.manufacturer || null,
              model: r.model || null,
              serial_number: r.serial_number || null,
              location: r.location || null,
              status: "operational",
            },
            { onConflict: "organization_id,asset_tag" } as any,
          );
          if (error) { result.errors.push({ row: i + 2, message: error.message }); result.skipped++; }
          else result.inserted++;
        }
        break;
      }
      case "stations": {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!required(r, ["station_name", "department"], i, result.errors)) { result.skipped++; continue; }
          if (dry_run) { result.inserted++; continue; }
          let deptId: string | null = null;
          const { data: existingDept } = await admin
            .from("departments").select("id").eq("organization_id", orgId).eq("name", r.department).maybeSingle();
          if (existingDept) deptId = (existingDept as any).id;
          else {
            const { data: newDept, error: dErr } = await admin
              .from("departments").insert({ organization_id: orgId, name: r.department }).select("id").maybeSingle();
            if (dErr) { result.errors.push({ row: i + 2, message: dErr.message }); result.skipped++; continue; }
            deptId = (newDept as any).id;
          }
          const { data: dup } = await admin
            .from("stations").select("id").eq("organization_id", orgId).eq("name", r.station_name).maybeSingle();
          if (dup) { result.skipped++; continue; }
          const { error } = await admin.from("stations").insert({
            organization_id: orgId,
            department_id: deptId,
            name: r.station_name,
            station_id: r.station_id || r.station_name.toUpperCase().replace(/\s+/g, "-"),
            work_center: r.station_type || "general",
            work_center_type: r.station_type || "general",
            daily_capacity_hours: r.capacity ? Number(r.capacity) : 8,
            is_active: true,
          });
          if (error) { result.errors.push({ row: i + 2, message: error.message }); result.skipped++; }
          else result.inserted++;
        }
        break;
      }
      case "users_roles": {
        // Pre-load existing invites + members so we can dedupe by email
        const { data: existingInvites } = await admin
          .from("organization_invites")
          .select("invited_email")
          .eq("organization_id", orgId)
          .eq("is_active", true);
        const inviteEmails = new Set(
          (existingInvites ?? [])
            .map((r: any) => (r.invited_email ?? "").toLowerCase())
            .filter(Boolean),
        );
        // Members table holds user_id; resolve emails via profiles
        const { data: members } = await admin
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", orgId);
        const memberIds = (members ?? []).map((m: any) => m.user_id).filter(Boolean);
        let memberEmails = new Set<string>();
        if (memberIds.length) {
          const { data: profs } = await admin
            .from("profiles").select("email").in("user_id", memberIds);
          memberEmails = new Set(
            (profs ?? []).map((p: any) => (p.email ?? "").toLowerCase()).filter(Boolean),
          );
        }

        // Load existing intake payload so we can merge instead of overwrite
        const { data: prior } = await admin
          .from("onboarding_intake_responses")
          .select("payload")
          .eq("engagement_id", engagement_id)
          .eq("module_key", "users_roles")
          .maybeSingle();
        const payload: any = (prior?.payload as any) ?? {};
        payload.supervisors = Array.isArray(payload.supervisors) ? payload.supervisors : [];
        payload.operators = Array.isArray(payload.operators) ? payload.operators : [];
        const intakeEmails = new Set<string>();
        if (payload.owner?.email) intakeEmails.add(String(payload.owner.email).toLowerCase());
        for (const u of [...payload.supervisors, ...payload.operators]) {
          if (u?.email) intakeEmails.add(String(u.email).toLowerCase());
        }

        const seenInBatch = new Set<string>();
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!required(r, ["email", "role"], i, result.errors)) { result.skipped++; continue; }
          const email = r.email.trim().toLowerCase();
          if (seenInBatch.has(email)) {
            result.errors.push({ row: i + 2, message: `Duplicate email in upload: ${email}` });
            result.skipped++; continue;
          }
          seenInBatch.add(email);
          if (memberEmails.has(email)) {
            result.errors.push({ row: i + 2, message: `${email} is already a member of this org` });
            result.skipped++; continue;
          }
          if (inviteEmails.has(email)) {
            result.errors.push({ row: i + 2, message: `${email} already has an active invite` });
            result.skipped++; continue;
          }
          if (dry_run) { result.inserted++; continue; }
          const code = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
          const { error } = await admin.from("organization_invites").insert({
            organization_id: orgId,
            invite_code: code,
            invited_email: email,
            org_role: r.role === "admin" ? "admin" : "member",
            app_role: ["admin","supervisor","operator","developer"].includes(r.role) ? r.role : "operator",
            created_by: uid,
            is_active: true,
            max_uses: 1,
            expires_at: new Date(Date.now() + 15 * 86400 * 1000).toISOString(),
          });
          if (error) { result.errors.push({ row: i + 2, message: error.message }); result.skipped++; continue; }
          inviteEmails.add(email);

          // Merge into intake payload (dedupe by email) so the editor reflects imports
          if (!intakeEmails.has(email)) {
            const member = {
              name: (r.first_name || r.last_name) ? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() : email.split("@")[0],
              email,
              role: r.role,
              app_role: ["admin","supervisor","operator","developer"].includes(r.role) ? r.role : "operator",
              invite_code: code,
            };
            if (r.role === "admin" && !payload.owner) payload.owner = member;
            else if (r.role === "supervisor") payload.supervisors.push(member);
            else payload.operators.push(member);
            intakeEmails.add(email);
          }
          result.inserted++;
        }

        if (!dry_run && result.inserted > 0) {
          await admin
            .from("onboarding_intake_responses")
            .upsert(
              {
                engagement_id,
                organization_id: orgId,
                module_key: "users_roles",
                payload,
                submitted_by: uid,
              },
              { onConflict: "engagement_id,module_key" } as any,
            );
        }
        break;
      }
      case "routing": {
        const byTemplate = new Map<string, Row[]>();
        for (const r of rows) {
          const k = r.template_name || "Default";
          if (!byTemplate.has(k)) byTemplate.set(k, []);
          byTemplate.get(k)!.push(r);
        }
        for (const [tplName, steps] of byTemplate) {
          if (dry_run) { result.inserted += steps.length; continue; }
          let tplId: string | null = null;
          const { data: existing } = await admin
            .from("routing_templates").select("id").eq("organization_id", orgId).eq("name", tplName).maybeSingle();
          if (existing) tplId = (existing as any).id;
          else {
            const { data: nt, error: tErr } = await admin
              .from("routing_templates").insert({ organization_id: orgId, name: tplName, created_by: uid }).select("id").maybeSingle();
            if (tErr) { result.errors.push({ row: 0, message: `Template ${tplName}: ${tErr.message}` }); continue; }
            tplId = (nt as any).id;
          }
          for (let idx = 0; idx < steps.length; idx++) {
            const s = steps[idx];
            const { error } = await admin.from("routing_template_steps").insert({
              template_id: tplId,
              organization_id: orgId,
              step_number: Number(s.step_number || idx + 1),
              operation_type: s.operation || "general",
              operation_name: s.operation || `Step ${idx + 1}`,
              work_center_type: s.work_center || null,
              setup_time_minutes: s.setup_minutes ? Number(s.setup_minutes) : null,
              cycle_time_minutes: s.run_minutes_per_unit ? Number(s.run_minutes_per_unit) : null,
            });
            if (error) { result.errors.push({ row: idx + 2, message: error.message }); result.skipped++; }
            else result.inserted++;
          }
        }
        break;
      }
      default:
        return json({ error: `Module "${module_key}" not supported for bulk import` }, 400);
    }

    if (!dry_run) {
      await admin.from("admin_audit_events").insert({
        actor_id: uid,
        action_type: "onboarding.bulk_import",
        target_type: "engagement",
        target_id: engagement_id,
        organization_id: orgId,
        metadata: { module_key, storage_path, inserted: result.inserted, skipped: result.skipped, errors: result.errors.length },
      });
    }

    return json(result);
  } catch (e: any) {
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
