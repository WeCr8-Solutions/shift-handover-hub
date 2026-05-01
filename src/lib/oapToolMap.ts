/**
 * Maps an OAP course slug to the inspection_tools.slug values whose attached
 * `training_media` (YouTube tutorials + diagrams) should be embedded inline
 * on every lesson and on the course's final quiz.
 *
 * Unknown slugs resolve to an empty list and the card is not rendered.
 */
export const OAP_COURSE_TOOL_SLUGS: Record<string, string[]> = {
  "measurement-inspection": [
    "outside-micrometer",
    "vernier-caliper",
    "dial-caliper",
    "digital-caliper",
    "depth-micrometer",
    "dial-indicator",
    "test-indicator",
    "dial-bore-gauge",
    "telescoping-gauge",
    "height-gauge-digital",
    "height-gauge-vernier",
  ],
};

export function getOapCourseToolSlugs(
  courseSlug: string | null | undefined,
): string[] {
  if (!courseSlug) return [];
  return OAP_COURSE_TOOL_SLUGS[courseSlug] ?? [];
}
