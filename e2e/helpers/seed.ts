import { request, type APIRequestContext } from "@playwright/test";

const SUPABASE_URL =
  process.env.E2E_SUPABASE_URL ?? "https://kgrstnbxqdmadtoankqr.supabase.co";
const SEED_SECRET = process.env.E2E_SEED_SECRET ?? "";

export interface SeedFixture {
  ok: boolean;
  admin: { id: string; email: string; password: string };
  operator: { id: string; email: string; password: string };
  organization: { id: string; slug: string; name: string };
  team: { id: string; name: string };
  station: { id: string; station_id: string; name: string };
  work_order: { id: string; code: string };
}

let cached: SeedFixture | null = null;

export async function seedFixture(api?: APIRequestContext): Promise<SeedFixture> {
  if (cached) return cached;
  if (!SEED_SECRET) {
    throw new Error(
      "E2E_SEED_SECRET env var is required to run e2e operator/admin/team specs",
    );
  }
  const ctx = api ?? (await request.newContext());
  const res = await ctx.post(`${SUPABASE_URL}/functions/v1/seed-e2e`, {
    headers: { "x-e2e-secret": SEED_SECRET, "Content-Type": "application/json" },
    data: {},
  });
  if (!res.ok()) {
    throw new Error(`seed-e2e failed: ${res.status()} ${await res.text()}`);
  }
  cached = (await res.json()) as SeedFixture;
  return cached;
}
