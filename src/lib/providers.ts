import type { ProviderWithUser } from "./types";
import { getComparablePrice } from "./pricing";
import { formatResponseTime, type RecommendationLabel } from "./recommendations";

export function getProviderUser(provider: ProviderWithUser) {
  const u = provider.users;
  return Array.isArray(u) ? u[0] : u;
}

export function computeProviderTags(provider: ProviderWithUser): string[] {
  const tags: string[] = [];
  const comparable = getComparablePrice(provider.pricing_type, Number(provider.price));
  const rating = Number(provider.rating_avg);
  const years = Number(provider.years_experience ?? 0);
  const responseMins = Number(provider.response_time_mins ?? 999);

  if (rating >= 4.5) tags.push("Top Rated");
  if (comparable <= 35) tags.push("Affordable");
  if (years >= 5) tags.push("Experienced");
  if (provider.available_today && responseMins <= 30) tags.push("Fast Responder");

  // Merge seed tags without duplicates
  for (const t of provider.tags ?? []) {
    const normalized = t === "Highly Rated" ? "Top Rated" : t;
    if (!tags.includes(normalized)) tags.push(normalized);
  }

  return tags.slice(0, 4);
}

function providerScore(provider: ProviderWithUser, service?: string, urgent?: boolean): number {
  let score = Number(provider.rating_avg) * 2;
  score -= getComparablePrice(provider.pricing_type, Number(provider.price)) / 100;
  if (provider.distance_miles) score -= Number(provider.distance_miles) / 20;
  if (service && provider.services.includes(service)) score += 1.5;
  if (provider.available_today) score += 0.5;
  if (urgent && (provider.response_time_mins ?? 999) <= 30) score += 1.2;
  if (urgent && provider.available_today) score += 0.8;
  return score;
}

export function rankProviders(
  providers: ProviderWithUser[],
  service?: string,
  urgent?: boolean
): ProviderWithUser[] {
  return [...providers].sort((a, b) => {
    const scoreA = providerScore(a, service, urgent);
    const scoreB = providerScore(b, service, urgent);
    return scoreB - scoreA;
  });
}

export function getTopProviderIds(providers: ProviderWithUser[], limit = 3): Set<string> {
  return new Set(rankProviders(providers).slice(0, limit).map((p) => p.id));
}

export type ProviderCardData = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  services: string[];
  pricingType: ProviderWithUser["pricing_type"];
  price: number;
  rating: number;
  location: string;
  distanceMiles?: number | null;
  approved: boolean;
  tags: string[];
  description?: string;
  recommendationLabel?: RecommendationLabel;
  responseTimeLabel?: string;
  reviewCount?: number;
  jobsCompleted?: number;
};

export function toProviderCardData(
  p: ProviderWithUser,
  extras?: Partial<Pick<ProviderCardData, "recommendationLabel">>
): ProviderCardData {
  const user = getProviderUser(p);
  return {
    id: p.id,
    name: user?.name ?? "Provider",
    avatarUrl: user?.avatar_url,
    services: p.services,
    pricingType: p.pricing_type,
    price: Number(p.price),
    rating: Number(p.rating_avg),
    location: p.location,
    distanceMiles: p.distance_miles,
    approved: p.approved,
    tags: computeProviderTags(p),
    description: p.description,
    recommendationLabel: extras?.recommendationLabel,
    responseTimeLabel: formatResponseTime(p.response_time_mins),
    reviewCount: p.review_count ?? undefined,
    jobsCompleted: p.jobs_completed ?? undefined,
  };
}
