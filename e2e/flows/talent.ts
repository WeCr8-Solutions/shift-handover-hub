import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

export async function visitPublicTalent(
  page: Page,
  ctx: FlowCtx,
  username: string,
) {
  await page.goto(`/talent/${username}`).catch(() => {});
  const ok = await page
    .getByText(new RegExp(username, "i"))
    .first()
    .isVisible()
    .catch(() => false);
  if (!ok) {
    recordGap({
      spec: ctx.spec,
      step: "visitPublicTalent",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "talent",
      severity: "error",
      category: "dead_end",
      message: `Public talent page for @${username} not rendered`,
      url: page.url(),
      repairHint:
        "Check anon RPC get_public_talent_profile + RLS on operator_profiles.",
    });
  }
  return ok;
}

export async function assertContactPrivacy(page: Page, ctx: FlowCtx) {
  const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
  const leaked = /[\w.+-]+@[\w-]+\.[\w.-]+|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(
    text,
  );
  if (leaked) {
    recordGap({
      spec: ctx.spec,
      step: "assertContactPrivacy",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "talent",
      severity: "error",
      category: "rls",
      message: "Public talent page leaked email or phone",
      url: page.url(),
      repairHint:
        "Mask contact fields in public talent view; route outreach via in-app messaging.",
    });
  }
  return !leaked;
}
