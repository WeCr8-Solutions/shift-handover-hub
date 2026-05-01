/**
 * Maps a GCA Measurement Tools test bank slug to one or more
 * `inspection_tools.slug` values whose attached `training_media` (YouTube
 * tutorials + reference diagrams) should be embedded inline on the test page.
 *
 * Keep this list in sync with the canonical inspection_tools slugs — unknown
 * slugs are silently dropped by GcaToolVideos so adding aspirational entries
 * is safe.
 */
export const GCA_BANK_TOOL_SLUGS: Record<string, string[]> = {
  "tool-test-micrometer": ["outside-micrometer"],
  "tool-test-vernier-caliper": [
    "vernier-caliper",
    "dial-caliper",
    "digital-caliper",
  ],
  "tool-test-height-gage": ["height-gauge-digital", "height-gauge-vernier"],
  "tool-test-dial-indicator": ["dial-indicator", "test-indicator"],
  "tool-test-depth-micrometer": ["depth-micrometer", "depth-gauge"],
  "tool-test-bore-gage": [
    "dial-bore-gauge",
    "bore-mic-2-point",
    "three-point-bore-mic",
    "small-hole-gauge",
  ],
  "tool-test-telescoping-gage": ["telescoping-gauge"],
  "tool-test-gage-blocks": [], // no canonical inspection_tools row yet
};

export function getGcaToolSlugs(bankSlug: string | undefined | null): string[] {
  if (!bankSlug) return [];
  return GCA_BANK_TOOL_SLUGS[bankSlug] ?? [];
}
