# Fix: GCA users can't view YouTube videos for measuring tools

## Problem

When operators open a GCA Measurement Tools test (e.g. `/gca/test/tool-test-micrometer`), the page shows:
- Bank header with topic badge
- A small "Measurement Tools" callout that links **away** to `/resources/measuring-tools`
- The `learning_content` markdown (text only)
- The question list

There is **no embedded video player** anywhere in the GCA test flow. The YouTube tutorials seeded into `training_media` (linked to `inspection_tools` rows like `outside-micrometer`, `dial-caliper`, `dial-indicator`, etc.) are only reachable by navigating to the public Measuring Tools Library and expanding the matching tool row — most learners never realize that's where the videos live, and they lose their test progress when they leave the page.

`GcaTestPlayer.tsx` and `GcaQuestionRow` never import `TrainingMedia` / `InspectionToolReference`, and there is no DB column linking a measurement bank or question to an `inspection_tools` row.

## Solution

Embed the existing YouTube tutorials inline inside the GCA test page for every Measurement Tools bank, and inside individual questions when they reference a specific tool — without sending the user away.

### 1. Bank ↔ inspection-tool mapping (no schema change)

Add a small static map in `src/lib/gcaToolMap.ts` keyed by bank slug:

```ts
export const GCA_BANK_TOOL_SLUGS: Record<string, string[]> = {
  "tool-test-micrometer":        ["outside-micrometer"],
  "tool-test-vernier-caliper":   ["vernier-caliper", "dial-caliper", "digital-caliper"],
  "tool-test-height-gage":       ["height-gage"], // will fall back gracefully if slug differs
  "tool-test-dial-indicator":    ["dial-indicator", "test-indicator"],
  "tool-test-depth-micrometer":  ["depth-micrometer", "depth-gauge"],
  "tool-test-bore-gage":         ["dial-bore-gauge", "small-hole-gauge"],
  "tool-test-telescoping-gage":  ["telescoping-gauge"],
  "tool-test-gage-blocks":       ["gage-blocks"],
};
```

(Static map keeps this purely a UI fix — no migration needed; existing seeded `training_media` rows are already YouTube-backed.)

### 2. New component: `GcaToolVideos.tsx`

`src/components/gca/GcaToolVideos.tsx` — given a list of inspection-tool slugs:
- Resolves each slug → `inspection_tools` row via one Supabase query
- Renders a `Card` titled "Watch the tool in action" containing one `<TrainingMedia entityType="inspection_tool" entityId={tool.id} />` per resolved tool, inside a `Tabs` (when >1 tool) or a single panel
- Falls back to a "Tutorials coming soon" hint if none resolve

`TrainingMedia` already handles YouTube embeds via `toYouTubeEmbed()` — so the videos play **inline** inside the GCA test page.

### 3. Wire it into the GCA test page

In `src/pages/GcaTestPage.tsx`:
- Replace the existing "Tool Library / Proficiency Test" callout (lines 136–156) with `<GcaToolVideos slugs={GCA_BANK_TOOL_SLUGS[bankSlug] ?? []} />` rendered **above** the Learning Section when `bank.topic === "Measurement Tools"` and a mapping exists.
- Keep the secondary "Open full library" + "Take proficiency test" buttons inside the new card's footer so the cross-links stay but no longer replace the video.

### 4. Verify YouTube iframe permissions

`TrainingMedia` already passes `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` and `allowFullScreen`. No CSP changes needed (other YouTube embeds in the same app render fine — `MediaOverlayDisplay` uses identical `youtube.com/embed/...` URLs).

### 5. Backfill missing tool media (data only)

Two slugs that the map references show `media_count = 0`:
- `outside-micrometer`
- `height-gage` (verify exact canonical slug; if absent we'll insert it before linking)

Insert one canonical YouTube tutorial row per missing tool into `training_media` (`storage_bucket = 'external'`, `media_type = 'video'`, `is_canonical = true`, `organization_id = NULL`) so every Measurement Tools bank shows at least one video.

### 6. Per-question tool tag (optional, low-risk)

Allow individual questions to surface their own tool video when relevant. Add an **optional** `tool_slug` lookup: parse a leading marker `[tool:digital-caliper]` from the question prompt at render time inside `GcaQuestionRow` and, when present, render a small "Show tool video" disclosure below the choices that lazy-mounts `<TrainingMedia entityType="inspection_tool" entityId={...} />`. Zero schema change, zero impact on existing questions, opt-in per question via a markdown-style tag we can add later.

## Files

**New**
- `src/lib/gcaToolMap.ts` — bank-slug → inspection-tool-slug map
- `src/components/gca/GcaToolVideos.tsx` — inline video card

**Edited**
- `src/pages/GcaTestPage.tsx` — replace external-link callout with embedded video card
- `src/components/gca/GcaTestPlayer.tsx` → `GcaQuestionRow` — optional `[tool:slug]` parsing + lazy `<TrainingMedia/>` disclosure

**Migration** (data only)
- `supabase/migrations/<ts>_gca_measurement_tool_videos.sql` — idempotent inserts into `training_media` for `outside-micrometer` and `height-gage` (verify slug first; insert tool row if missing)

## Verification

1. Sign in, open `/gca/test/tool-test-micrometer` — the YouTube tutorial for the outside micrometer plays inline above the Learning Section.
2. Open `/gca/test/tool-test-vernier-caliper` — tabbed videos for vernier / dial / digital calipers all play without leaving the page.
3. Open a non-measurement bank (e.g. `/gca/test/cutting-tool-knowledge`) — no video card renders, behavior unchanged.
4. Submit and grade a measurement test — scoring + review flow still works (no regression in `grade_gca_attempt` RPC path).
