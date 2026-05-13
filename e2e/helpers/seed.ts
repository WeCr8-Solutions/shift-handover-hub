import { request, type APIRequestContext } from "@playwright/test";

// When targeting the published Live app (joblineai.lovable.app or jobline.ai),
// you MUST set E2E_SUPABASE_URL=https://dpajcbhfwmfnzgldrveu.supabase.co.
// The default below targets the Test/Preview backend.
const SUPABASE_URL =
  process.env.E2E_SUPABASE_URL ?? "https://kgrstnbxqdmadtoankqr.supabase.co";
const SEED_SECRET = process.env.E2E_SEED_SECRET ?? "";

export type SeedScenario =
  | "wo_basic"
  | "wo_routed"
  | "handoff_chain"
  | "ncr_path"
  | "cert_paid"
  | "recert_lifecycle";

export interface SeedFixture {
  ok: boolean;
  scenario: SeedScenario;
  admin: { id: string; email: string; password: string };
  operator: { id: string; email: string; password: string };
  organization: { id: string; slug: string; name: string };
  team: { id: string; name: string };
  station: { id: string; station_id: string; name: string };
  work_order: { id: string; code: string };
}

const cache = new Map<SeedScenario, SeedFixture>();

/**
 * Fetches a deterministic seeded fixture from the `seed-e2e` edge function.
 * The same scenario is cached per-process so multiple specs share one seed call.
 *
 * @param scenario  Which scenario to seed. Default: "wo_basic".
 * @param api       Optional Playwright APIRequestContext (will create one if omitted).
 */
export async function seedFixture(
  scenario: SeedScenario = "wo_basic",
  api?: APIRequestContext,
): Promise<SeedFixture> {
  const cached = cache.get(scenario);
  if (cached) return cached;
  if (!SEED_SECRET) {
    throw new Error(
      "E2E_SEED_SECRET env var is required to run e2e operator/admin/team specs",
    );
  }
  const ctx = api ?? (await request.newContext());
  const res = await ctx.post(`${SUPABASE_URL}/functions/v1/seed-e2e`, {
    headers: { "x-e2e-secret": SEED_SECRET, "Content-Type": "application/json" },
    data: { scenario },
  });
  if (!res.ok()) {
    throw new Error(`seed-e2e failed: ${res.status()} ${await res.text()}`);
  }
  const fx = (await res.json()) as SeedFixture;
  fx.scenario = scenario;
  cache.set(scenario, fx);
  return fx;
}
