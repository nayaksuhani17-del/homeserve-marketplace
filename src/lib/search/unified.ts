import { SERVICE_CATEGORIES } from "@/lib/constants";
import { parseSearchFallback } from "@/lib/ai/parse-search";
import type { MockDatabase, MockProvider, MockUser } from "@/lib/mock/types";

export type UnifiedSearchResult = {
  resultId: string;
  userId: string;
  providerId?: string;
  name: string;
  role: "provider" | "customer";
  services: string[];
  ratingAvg: number;
  reviewCount: number;
  location: string;
  approved: boolean;
  matchType: "name" | "service" | "both";
  matchedTerms: string[];
};

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function detectServiceInQuery(query: string): string | undefined {
  const parsed = parseSearchFallback(query);
  if (parsed.service) return parsed.service;
  const lower = query.toLowerCase();
  for (const service of SERVICE_CATEGORIES) {
    if (lower.includes(service.toLowerCase())) return service;
  }
  const aliases: Record<string, string> = {
    cleaning: "House Cleaning",
    cleaner: "House Cleaning",
    clean: "House Cleaning",
    plumber: "Plumber",
    plumbing: "Plumber",
    electrician: "Electrician",
    electric: "Electrician",
    paint: "Painting",
    painter: "Painting",
    lawn: "Lawn Mowing",
    mowing: "Lawn Mowing",
    mechanic: "Car Mechanic",
    computer: "Computer Repair",
    moving: "House Shifting",
    chef: "Cooking",
    cook: "Cooking",
    carpet: "Carpet Cleaning",
  };
  for (const [key, service] of Object.entries(aliases)) {
    if (lower.includes(key)) return service;
  }
  return undefined;
}

function userMatchesName(
  user: MockUser | MockProvider,
  tokens: string[],
  fullQuery: string
): boolean {
  const name = user.name.toLowerCase();
  const email = user.email.toLowerCase();
  const q = fullQuery.toLowerCase();
  if (name.includes(q) || q.includes(name.split(" ")[0] ?? "")) return true;
  return tokens.some(
    (t) =>
      t.length >= 2 &&
      (name.includes(t) || email.split("@")[0]!.includes(t))
  );
}

function providerMatchesService(
  provider: MockProvider,
  service?: string,
  tokens?: string[]
): boolean {
  if (service && provider.services.includes(service)) return true;
  if (!tokens) return false;
  return tokens.some((t) =>
    provider.services.some((s) => s.toLowerCase().includes(t))
  );
}

export function advancedSearch(
  db: MockDatabase,
  query: string,
  opts?: { verifiedOnly?: boolean }
): UnifiedSearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const verifiedOnly = opts?.verifiedOnly ?? true;
  const tokens = tokenize(q);
  const serviceHint = detectServiceInQuery(q);
  const activeUserIds = new Set(db.users.map((u) => u.id));
  const bannedUserIds = new Set(db.users.filter((u) => u.banned).map((u) => u.id));

  let providers = db.providers.filter(
    (p) => activeUserIds.has(p.userId) && !bannedUserIds.has(p.userId)
  );
  if (verifiedOnly) providers = providers.filter((p) => p.approved && !p.rejected);

  const results: UnifiedSearchResult[] = [];
  const seenUserIds = new Set<string>();

  for (const provider of providers) {
    const nameMatch = userMatchesName(provider, tokens, q);
    const serviceMatch = providerMatchesService(provider, serviceHint, tokens);
    const descMatch = tokens.some(
      (t) => t.length >= 3 && provider.description.toLowerCase().includes(t)
    );

    if (!nameMatch && !serviceMatch && !descMatch) continue;

    const matchedTerms: string[] = [];
    if (nameMatch) {
      matchedTerms.push(
        ...tokens.filter((t) => provider.name.toLowerCase().includes(t))
      );
    }
    if (serviceHint) matchedTerms.push(serviceHint);

    let matchType: UnifiedSearchResult["matchType"] = "name";
    if (nameMatch && serviceMatch) matchType = "both";
    else if (serviceMatch) matchType = "service";

    seenUserIds.add(provider.userId);
    results.push({
      resultId: provider.id,
      userId: provider.userId,
      providerId: provider.id,
      name: provider.name,
      role: "provider",
      services: provider.services,
      ratingAvg: provider.ratingAvg,
      reviewCount: provider.reviewCount,
      location: provider.location,
      approved: provider.approved,
      matchType,
      matchedTerms: [...new Set(matchedTerms.filter(Boolean))],
    });
  }

  const nameFocused = tokens.some((t) => t.length >= 2) || q.length >= 2;
  if (nameFocused) {
    for (const user of db.users) {
      if (user.banned || user.role === "admin") continue;
      if (seenUserIds.has(user.id)) continue;
      if (user.role !== "customer") continue;
      if (!userMatchesName(user, tokens, q)) continue;

      seenUserIds.add(user.id);
      results.push({
        resultId: user.id,
        userId: user.id,
        name: user.name,
        role: "customer",
        services: [],
        ratingAvg: 0,
        reviewCount: 0,
        location: "",
        approved: true,
        matchType: "name",
        matchedTerms: tokens.filter((t) => user.name.toLowerCase().includes(t)),
      });
    }
  }

  results.sort((a, b) => {
    if (a.matchType === "both" && b.matchType !== "both") return -1;
    if (b.matchType === "both" && a.matchType !== "both") return 1;
    if (a.role === "provider" && b.role === "customer") return -1;
    if (b.role === "provider" && a.role === "customer") return 1;
    return b.ratingAvg - a.ratingAvg;
  });

  return results;
}
