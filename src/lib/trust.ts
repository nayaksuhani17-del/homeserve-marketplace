import type { ProviderWithUser } from "./types";

export type TrustBadgeKey =
  | "verified"
  | "jobs-100"
  | "repeat-customers"
  | "highly-recommended";

export const TRUST_BADGE_CONFIG: Record<
  TrustBadgeKey,
  { label: string; icon: string; className: string }
> = {
  verified: {
    label: "Verified",
    icon: "✅",
    className: "badge-verified",
  },
  "jobs-100": {
    label: "100+ jobs",
    icon: "💼",
    className: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  },
  "repeat-customers": {
    label: "Repeat customers",
    icon: "🔁",
    className: "bg-purple-50 text-purple-800 ring-1 ring-purple-100",
  },
  "highly-recommended": {
    label: "Highly recommended",
    icon: "⭐",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  },
};

export function computeTrustBadges(provider: ProviderWithUser): TrustBadgeKey[] {
  const badges: TrustBadgeKey[] = [];
  if (provider.approved) badges.push("verified");
  const jobs = Number(provider.jobs_completed ?? 0);
  const rating = Number(provider.rating_avg);
  const reviews = Number(provider.review_count ?? 0);

  if (jobs >= 100) badges.push("jobs-100");
  if (jobs >= 40 && reviews >= 8 && rating >= 4.3) badges.push("repeat-customers");
  if (rating >= 4.6 && reviews >= 5) badges.push("highly-recommended");

  return badges;
}

/** Demo-only activity estimate for marketplace cards (not live analytics). */
export function getViewerCount(providerId: string): number {
  let h = 0;
  for (let i = 0; i < providerId.length; i++) {
    h = (h * 31 + providerId.charCodeAt(i)) >>> 0;
  }
  const hour = new Date().getHours();
  return 1 + (h % 4) + (hour % 3);
}
