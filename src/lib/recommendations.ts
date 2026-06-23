import { rankProviders } from "./providers";
import type { ProviderWithUser } from "./types";

export type RecommendationLabel = "best-match" | "top-rated" | "budget-option";

export const RECOMMENDATION_LABELS: Record<
  RecommendationLabel,
  { text: string; className: string }
> = {
  "best-match": {
    text: "Best Match",
    className: "bg-green-600 text-white",
  },
  "top-rated": {
    text: "Top Rated",
    className: "bg-amber-500 text-white",
  },
  "budget-option": {
    text: "Budget Option",
    className: "bg-blue-600 text-white",
  },
};

export function assignRecommendationLabels(
  providers: ProviderWithUser[]
): Map<string, RecommendationLabel> {
  const map = new Map<string, RecommendationLabel>();
  if (providers.length === 0) return map;

  const ranked = rankProviders(providers);
  const byRating = [...providers].sort(
    (a, b) => Number(b.rating_avg) - Number(a.rating_avg)
  );
  const byPrice = [...providers].sort(
    (a, b) => Number(a.hourly_rate) - Number(b.hourly_rate)
  );

  if (ranked[0]) map.set(ranked[0].id, "best-match");

  const topRated = byRating.find((p) => !map.has(p.id)) ?? byRating[0];
  if (topRated) map.set(topRated.id, "top-rated");

  const budget = byPrice.find((p) => !map.has(p.id)) ?? byPrice[0];
  if (budget && map.size < 3) map.set(budget.id, "budget-option");

  return map;
}

export function formatResponseTime(mins?: number | null): string {
  if (mins == null) return "Responds within a day";
  if (mins <= 15) return "Responds in ~10 mins";
  if (mins <= 45) return `Responds in ~${mins} mins`;
  if (mins <= 90) return "Responds in ~1 hour";
  const hrs = Math.round(mins / 60);
  return hrs <= 4 ? `Responds in ~${hrs} hours` : "Responds within a day";
}
