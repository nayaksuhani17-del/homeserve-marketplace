import { RECOMMENDATION_LABELS, type RecommendationLabel } from "@/lib/recommendations";

export function RecommendationBadge({ label }: { label: RecommendationLabel }) {
  const config = RECOMMENDATION_LABELS[label];
  return (
    <span className={`tag-pill shrink-0 font-semibold ${config.className}`}>
      {config.text}
    </span>
  );
}
