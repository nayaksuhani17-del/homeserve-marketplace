import type { ProviderWithUser } from "./types";

export function getProviderUser(provider: ProviderWithUser) {
  const u = provider.users;
  return Array.isArray(u) ? u[0] : u;
}

export function computeProviderTags(provider: ProviderWithUser): string[] {
  const tags = [...(provider.tags ?? [])];
  const rate = Number(provider.hourly_rate);
  const rating = Number(provider.rating_avg);

  if (rating >= 4.5 && !tags.includes("Highly Rated")) tags.push("Highly Rated");
  if (rate <= 35 && !tags.includes("Affordable")) tags.push("Affordable");
  if (provider.available_today && !tags.includes("Fast Responder")) {
    tags.push("Fast Responder");
  }

  return tags.slice(0, 3);
}

export function rankProviders(
  providers: ProviderWithUser[],
  service?: string
): ProviderWithUser[] {
  return [...providers].sort((a, b) => {
    const scoreA = providerScore(a, service);
    const scoreB = providerScore(b, service);
    return scoreB - scoreA;
  });
}

function providerScore(provider: ProviderWithUser, service?: string): number {
  let score = Number(provider.rating_avg) * 2;
  score -= Number(provider.hourly_rate) / 100;
  if (provider.distance_miles) score -= Number(provider.distance_miles) / 20;
  if (service && provider.services.includes(service)) score += 1.5;
  if (provider.available_today) score += 0.5;
  return score;
}

export function getTopProviderIds(providers: ProviderWithUser[], limit = 3): Set<string> {
  return new Set(rankProviders(providers).slice(0, limit).map((p) => p.id));
}

export type ProviderCardData = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  services: string[];
  hourlyRate: number;
  rating: number;
  location: string;
  distanceMiles?: number | null;
  approved: boolean;
  tags: string[];
  description?: string;
};

export function toProviderCardData(p: ProviderWithUser): ProviderCardData {
  const user = getProviderUser(p);
  return {
    id: p.id,
    name: user?.name ?? "Provider",
    avatarUrl: user?.avatar_url,
    services: p.services,
    hourlyRate: Number(p.hourly_rate),
    rating: Number(p.rating_avg),
    location: p.location,
    distanceMiles: p.distance_miles,
    approved: p.approved,
    tags: computeProviderTags(p),
    description: p.description,
  };
}
