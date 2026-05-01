import { InspectionToolVideoCard } from "@/components/training/InspectionToolVideoCard";

interface Props {
  slugs: string[];
}

/**
 * GCA-facing wrapper around the shared InspectionToolVideoCard.
 * Kept as a thin alias so existing imports in GcaTestPage continue to work.
 */
export function GcaToolVideos({ slugs }: Props) {
  return <InspectionToolVideoCard slugs={slugs} />;
}
