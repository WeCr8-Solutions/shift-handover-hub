import type { RoutingProposal } from "@/components/planning/RoutingProposalCard";

/**
 * Extract a routing-proposal JSON block from an assistant markdown message.
 * The AI is instructed to emit ```routing-proposal { ... } ``` blocks.
 *
 * Returns:
 *   - cleanedContent: the message with the block stripped (so markdown stays clean)
 *   - proposal: the parsed RoutingProposal, or null if none / invalid.
 */
export function extractRoutingProposal(content: string): {
  cleanedContent: string;
  proposal: RoutingProposal | null;
} {
  if (!content) return { cleanedContent: content, proposal: null };

  // Match either ```routing-proposal ... ``` or ```json routing-proposal ... ```
  const fence =
    /```(?:routing-proposal|json\s+routing-proposal)\s*\n([\s\S]*?)\n?```/i;
  const match = content.match(fence);

  if (!match) return { cleanedContent: content, proposal: null };

  const jsonBody = match[1].trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonBody);
  } catch {
    return { cleanedContent: content, proposal: null };
  }

  // Minimal shape validation
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as RoutingProposal).changes) ||
    (parsed as RoutingProposal).changes.length === 0
  ) {
    return { cleanedContent: content, proposal: null };
  }

  // Validate each change has required ids
  const ok = (parsed as RoutingProposal).changes.every(
    (c) =>
      c &&
      typeof c.routing_step_id === "string" &&
      typeof c.queue_item_id === "string" &&
      typeof c.to_station_id === "string",
  );
  if (!ok) return { cleanedContent: content, proposal: null };

  const cleanedContent = content.replace(fence, "").trim();
  return { cleanedContent, proposal: parsed as RoutingProposal };
}
