import {
  DEMO_PROVIDERS,
  DEMO_REVIEWS,
  getDemoUserByKey,
  providerId,
  userId,
} from "./seed-data";
import {
  CATALOG_SIZE,
  DEMO_PAGE_SIZE,
  getCatalogProviders,
  getCatalogReviewsForProvider,
  getCatalogStats,
} from "./catalog";
import { rankProviders, toProviderCardData, type ProviderCardData } from "../providers";
import type { ProviderWithUser } from "../types";

function ratingForSeedProvider(userKey: string): number {
  const reviews = DEMO_REVIEWS.filter((r) => r.providerKey === userKey);
  if (reviews.length === 0) return 4.5;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}

function buildSeedProviders(): ProviderWithUser[] {
  return DEMO_PROVIDERS.map((p) => {
    const user = getDemoUserByKey(p.userKey)!;
    return {
      id: providerId(p.userKey),
      user_id: userId(p.userKey),
      services: p.services,
      hourly_rate: p.hourlyRate,
      location: p.location,
      description: p.description,
      availability: p.availability,
      rating_avg: ratingForSeedProvider(p.userKey),
      approved: p.approved,
      distance_miles: p.distanceMiles,
      jobs_completed: p.jobsCompleted,
      years_experience: p.yearsExperience,
      tags: p.tags,
      available_today: p.availableToday,
      available_tomorrow: p.availableTomorrow,
      users: {
        name: user.name,
        email: user.email,
        avatar_url: user.avatarUrl,
      },
    };
  });
}

let allProvidersCache: ProviderWithUser[] | null = null;

/** Featured seed providers + 350 generated catalog entries. */
export function buildDemoProviders(): ProviderWithUser[] {
  if (!allProvidersCache) {
    const seed = buildSeedProviders();
    const seedIds = new Set(seed.map((p) => p.id));
    const catalog = getCatalogProviders().filter((p) => !seedIds.has(p.id));
    allProvidersCache = [...seed, ...catalog];
  }
  return allProvidersCache;
}

export { getCatalogStats, DEMO_PAGE_SIZE, CATALOG_SIZE };

export function getDemoProviderCards(service?: string, limit = 3): ProviderCardData[] {
  const verified = buildDemoProviders().filter((p) => p.approved);

  if (service) {
    const matched = rankProviders(
      verified.filter((p) => p.services.includes(service)),
      service
    );
    if (matched.length >= limit) {
      return matched.slice(0, limit).map(toProviderCardData);
    }
    const rest = rankProviders(
      verified.filter((p) => !matched.some((m) => m.id === p.id)),
      service
    );
    return [...matched, ...rest].slice(0, limit).map(toProviderCardData);
  }

  return rankProviders(verified, service).slice(0, limit).map(toProviderCardData);
}

export function getDemoProviderById(id: string): ProviderWithUser | undefined {
  return buildDemoProviders().find((p) => p.id === id);
}

export type DemoProviderFilters = {
  service?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  maxDistance?: string;
  availability?: string;
  sort?: string;
  page?: string;
  status?: string;
};

export type DemoProviderResult = {
  providers: ProviderWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: { total: number; verified: number; pending: number };
};

export function applyDemoFilters(filters: DemoProviderFilters): ProviderWithUser[] {
  let list = buildDemoProviders();

  if (filters.status === "verified") {
    list = list.filter((p) => p.approved);
  } else if (filters.status === "pending") {
    list = list.filter((p) => !p.approved);
  }

  if (filters.service) {
    list = list.filter((p) => p.services.includes(filters.service!));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.users.name.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (filters.minPrice) {
    list = list.filter((p) => Number(p.hourly_rate) >= Number(filters.minPrice));
  }
  if (filters.maxPrice && Number(filters.maxPrice) < 120) {
    list = list.filter((p) => Number(p.hourly_rate) <= Number(filters.maxPrice));
  }
  if (filters.minRating) {
    list = list.filter((p) => Number(p.rating_avg) >= Number(filters.minRating));
  }
  if (filters.maxDistance) {
    list = list.filter(
      (p) => p.distance_miles != null && p.distance_miles <= Number(filters.maxDistance)
    );
  }
  if (filters.availability === "today") {
    list = list.filter((p) => p.available_today);
  }
  if (filters.availability === "tomorrow") {
    list = list.filter((p) => p.available_tomorrow);
  }

  if (filters.sort === "price") {
    list.sort((a, b) => Number(a.hourly_rate) - Number(b.hourly_rate));
  } else {
    list = rankProviders(list, filters.service);
  }

  return list;
}

export function filterDemoProviders(filters: DemoProviderFilters): DemoProviderResult {
  const list = applyDemoFilters(filters);

  const pageSize = DEMO_PAGE_SIZE;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);
  const start = (page - 1) * pageSize;

  const all = buildDemoProviders();
  const stats = {
    total: all.length,
    verified: all.filter((p) => p.approved).length,
    pending: all.filter((p) => !p.approved).length,
  };

  return {
    providers: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    stats,
  };
}

export function getDemoReviewsForProvider(providerIdValue: string) {
  const catalogReviews = getCatalogReviewsForProvider(providerIdValue);
  if (catalogReviews.length > 0) return catalogReviews;

  const userKey = DEMO_PROVIDERS.find(
    (p) => providerId(p.userKey) === providerIdValue
  )?.userKey;
  if (!userKey) return [];

  return DEMO_REVIEWS.filter((r) => r.providerKey === userKey).map((r, i) => {
    const customer = getDemoUserByKey(r.customerKey)!;
    return {
      rating: r.rating,
      comment: r.comment,
      created_at: new Date(Date.now() - i * 86400000 * 7).toISOString(),
      users: { name: customer.name },
    };
  });
}

export function getDemoAdminProviders() {
  return buildDemoProviders()
    .sort((a, b) => Number(b.approved) - Number(a.approved))
    .map((p) => ({
      id: p.id,
      services: p.services,
      hourly_rate: p.hourly_rate,
      location: p.location,
      approved: p.approved,
      rating_avg: p.rating_avg,
      users: p.users,
    }));
}
