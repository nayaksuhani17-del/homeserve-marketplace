import { SERVICE_CATEGORIES } from "@/lib/constants";

export type SearchFilters = {
  service?: string;
  sort?: "rating" | "price" | "distance";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  availability?: "today" | "tomorrow";
  q?: string;
};

export type SearchIntent = {
  urgency: boolean;
  priceSensitive: boolean;
  qualityFocus: boolean;
};

export type ParsedSearchResult = SearchFilters & {
  /** Whether a service category was confidently detected. */
  serviceConfidence: "matched" | "unclear";
  intent: SearchIntent;
};

/** Multi-word phrases first — longer matches win over shorter overlaps. */
const SERVICE_PHRASES: Record<string, string[]> = {
  Plumber: [
    "sink is leaking",
    "sink leaking",
    "water leaking",
    "pipe burst",
    "burst pipe",
    "clogged drain",
    "drain blocked",
    "drain is blocked",
    "toilet not working",
    "toilet broken",
    "bathroom flooded",
    "bathroom flood",
    "water problem",
    "water issue",
    "kitchen issue",
    "kitchen sink",
    "tap is broken",
    "tap broken",
    "broken tap",
    "faucet broken",
    "pipe leak",
    "leaking pipe",
    "plumbing",
    "plumber",
    "leak",
    "leaking",
    "leaky",
    "pipe",
    "pipes",
    "sink",
    "toilet",
    "drain",
    "faucet",
    "tap",
    "plumb",
    "water damage",
    "flooded",
    "backup",
    "backed up",
    "sewer",
    "disposal",
    "garbage disposal",
    "hot water",
    "no water",
    "dripping",
  ],
  "House Cleaning": [
    "house is dirty",
    "home is dirty",
    "need cleaner",
    "need a cleaner",
    "messy home",
    "messy house",
    "deep cleaning",
    "deep clean",
    "vacuum needed",
    "need vacuum",
    "tidy up",
    "clean my place",
    "clean my house",
    "clean my home",
    "maid needed",
    "need a maid",
    "house clean",
    "house cleaning",
    "home cleaning",
    "cleaner",
    "cleaning",
    "clean up",
    "cleanup",
    "maid",
    "housekeeping",
    "sanitize",
    "sanitizing",
    "dust",
    "dusty",
    "scrub",
    "mop",
    "dirty house",
    "dirty home",
    "messy",
    "spotless",
  ],
  Electrician: [
    "lights not working",
    "light not working",
    "power issue",
    "power problem",
    "electric problem",
    "electrical problem",
    "wiring issue",
    "bad wiring",
    "switch broken",
    "broken switch",
    "short circuit",
    "fan not working",
    "ceiling fan",
    "outlet not working",
    "no power",
    "power out",
    "electrician",
    "electrical",
    "electric",
    "wire",
    "wiring",
    "outlet",
    "socket",
    "light",
    "lights",
    "lighting",
    "circuit",
    "breaker",
    "fuse",
    "panel",
    "spark",
    "sparking",
    "dimmer",
    "generator",
  ],
  Painting: [
    "paint house",
    "paint my house",
    "paint room",
    "wall damaged",
    "damaged wall",
    "need repaint",
    "repaint",
    "re-paint",
    "fix walls",
    "wall repair",
    "color change",
    "change color",
    "new paint",
    "fresh paint",
    "painter",
    "painting",
    "paint",
    "wallpaper",
    "stain",
    "peeling paint",
    "touch up",
    "touch-up",
    "interior paint",
    "exterior paint",
  ],
  "Lawn Mowing": [
    "grass too big",
    "grass too long",
    "overgrown yard",
    "overgrown lawn",
    "yard messy",
    "messy yard",
    "cut grass",
    "mow lawn",
    "mow grass",
    "lawn mowing",
    "garden help",
    "weed removal",
    "remove weeds",
    "yard work",
    "landscaping",
    "lawn",
    "grass",
    "yard",
    "mow",
    "mowing",
    "garden",
    "hedge",
    "trim bushes",
    "weeds",
    "mulch",
    "leaf",
    "leaves",
  ],
  "Carpet Cleaning": [
    "carpet clean",
    "carpet stain",
    "rug clean",
    "upholstery",
    "carpet",
    "rug",
    "stain removal",
    "steam clean",
  ],
  Cooking: [
    "private chef",
    "personal chef",
    "meal prep",
    "meal delivery",
    "dinner party",
    "catering",
    "cook for",
    "chef",
    "cooking",
    "cook",
    "meal",
    "dinner",
    "lunch",
    "brunch",
  ],
  "Car Mechanic": [
    "oil change",
    "car won't start",
    "check engine",
    "flat tire",
    "brake problem",
    "car repair",
    "auto repair",
    "mechanic",
    "car",
    "auto",
    "vehicle",
    "engine",
    "brake",
    "tire",
    "battery",
    "transmission",
  ],
  "Computer Repair": [
    "computer repair",
    "laptop repair",
    "pc repair",
    "wifi problem",
    "internet slow",
    "virus removal",
    "screen broken",
    "computer",
    "laptop",
    "pc",
    "mac",
    "wifi",
    "network",
    "tech support",
    "printer",
  ],
  "House Shifting": [
    "moving company",
    "house shifting",
    "move house",
    "move out",
    "move in",
    "relocate",
    "movers",
    "moving",
    "move",
    "packing",
    "furniture move",
  ],
};

const SERVICE_RESPONSE_LABEL: Record<string, string> = {
  Plumber: "plumbing issue",
  "House Cleaning": "cleaning need",
  Electrician: "electrical issue",
  Painting: "painting project",
  "Lawn Mowing": "yard or lawn care need",
  "Carpet Cleaning": "carpet cleaning need",
  Cooking: "cooking or catering need",
  "Car Mechanic": "auto repair need",
  "Computer Repair": "tech repair need",
  "House Shifting": "moving need",
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPhrase(text: string, phrase: string): boolean {
  const normalized = normalizeText(text);
  const needle = normalizeText(phrase);
  if (!needle) return false;
  return normalized.includes(needle);
}

function guessService(message: string): { service?: string; confidence: "matched" | "unclear" } {
  const lower = normalizeText(message);
  let best: { service: string; score: number } | null = null;

  for (const [category, phrases] of Object.entries(SERVICE_PHRASES)) {
    for (const phrase of phrases) {
      if (matchesPhrase(lower, phrase)) {
        const score = phrase.length;
        if (!best || score > best.score) {
          best = { service: category, score };
        }
      }
    }
  }

  if (best && best.score >= 4) {
    return { service: best.service, confidence: "matched" };
  }

  const direct = SERVICE_CATEGORIES.find((c) => lower.includes(c.toLowerCase()));
  if (direct) return { service: direct, confidence: "matched" };

  if (/handyman|fix something|need repair|something broken|broken something/.test(lower)) {
    return { service: "Plumber", confidence: "matched" };
  }

  return { confidence: "unclear" };
}

export function detectSearchIntent(query: string): SearchIntent {
  const lower = normalizeText(query);

  const urgency =
    /\b(asap|urgent|urgently|emergency|immediately|right away|right now|same day|today|now)\b/.test(
      lower
    );

  const priceSensitive =
    /\b(cheap|affordable|budget|low cost|lowest price|inexpensive|save money|not expensive|good deal|best price)\b/.test(
      lower
    );

  const qualityFocus =
    /\b(best|top rated|top-rated|highly rated|good reviews|great reviews|high rating|5 star|five star|4 star|four star|trusted|reputable|experienced pro)\b/.test(
      lower
    );

  return { urgency, priceSensitive, qualityFocus };
}

export function parseSearchDetailed(query: string): ParsedSearchResult {
  const lower = normalizeText(query);
  const { service, confidence } = guessService(query);
  const intent = detectSearchIntent(query);
  const filters: SearchFilters = { service };

  if (intent.priceSensitive) {
    filters.sort = "price";
    filters.maxPrice = filters.maxPrice ?? 45;
  } else if (intent.qualityFocus) {
    filters.sort = "rating";
    filters.minRating = filters.minRating ?? 4;
  }

  if (/\b4\+?\s*star\b|\bfour star\b|\b4 star\b/.test(lower)) {
    filters.minRating = 4;
    if (!filters.sort) filters.sort = "rating";
  }

  if (/\bnear me\b|\bnearby\b|\bclose by\b|\bclose to me\b|\blocal\b|\baround here\b/.test(lower)) {
    if (!filters.sort) filters.sort = "distance";
  }

  if (intent.urgency) {
    filters.availability = "today";
  } else if (/\btomorrow\b/.test(lower)) {
    filters.availability = "tomorrow";
  }

  const priceMatch = lower.match(
    /(?:under|below|less than|max|maximum)\s*\$?\s*(\d+)/
  );
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[1]);
    filters.sort = "price";
  }

  return {
    ...filters,
    serviceConfidence: confidence,
    intent,
  };
}

/** Executive-facing intent chips for the assistant UI. */
export function buildIntentChips(result: ParsedSearchResult): string[] {
  const chips: string[] = [];
  if (result.service) chips.push(result.service);
  if (result.intent.urgency) chips.push("Same-day priority");
  if (result.intent.priceSensitive) chips.push("Budget-conscious");
  else if (result.intent.qualityFocus) chips.push("Top-rated");
  if (result.maxDistance) chips.push("Nearby");
  if (result.availability === "tomorrow" && !result.intent.urgency) {
    chips.push("Tomorrow availability");
  }
  return chips;
}

/** Natural-language assistant reply for the AI Help Search UI. */
export function buildAssistantMessage(
  result: ParsedSearchResult,
  options?: { hasLocation?: boolean; radius?: number }
): string {
  const radius = options?.radius ?? 50;
  const located = options?.hasLocation !== false;

  if (result.serviceConfidence === "unclear" || !result.service) {
    if (located) {
      return `Showing top nearby providers based on your location and request. Results are within ${radius} miles, sorted by distance and rating.`;
    }
    return "Set your location to see nearby providers. We've surfaced highly rated professionals you can browse below.";
  }

  const issue =
    SERVICE_RESPONSE_LABEL[result.service] ??
    `${result.service.toLowerCase()} request`;

  const who =
    result.service === "Plumber"
      ? "plumbers"
      : result.service === "Electrician"
        ? "electricians"
        : result.service
          ? `${result.service.toLowerCase()} pros`
          : "providers";

  let message = located
    ? `Showing nearby ${who} based on your request. You can refine results using filters.`
    : `We matched your ${issue}. Set your location to prioritize nearby providers.`;

  if (result.intent.urgency) {
    message += " Same-day availability prioritized.";
  }
  if (result.intent.priceSensitive) {
    message += " Budget-friendly options ranked first.";
  } else if (result.intent.qualityFocus) {
    message += " Top-rated pros ranked first.";
  } else if (located) {
    message += " Sorted closest first, then by rating.";
  }

  return message;
}

export function parseSearchFallback(query: string): SearchFilters {
  const { serviceConfidence, intent, ...filters } = parseSearchDetailed(query);
  void serviceConfidence;
  void intent;
  return filters;
}

/**
 * When a service filter is already applied, return leftover text that should still
 * narrow results — or null if the query only names the service (e.g. "painter").
 */
export function effectiveSearchQuery(
  query: string,
  service?: string
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (!service) return trimmed;

  const { service: detected, confidence } = guessService(trimmed);
  if (confidence !== "matched" || detected !== service) {
    return trimmed;
  }

  let remainder = normalizeText(trimmed);
  const phrases = [...(SERVICE_PHRASES[service] ?? [])].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of phrases) {
    const needle = normalizeText(phrase);
    if (needle && remainder.includes(needle)) {
      remainder = remainder.replace(needle, " ").replace(/\s+/g, " ").trim();
    }
  }

  const categoryNeedle = normalizeText(service);
  if (remainder === categoryNeedle) remainder = "";

  const serviceWords = new Set(
    phrases.flatMap((p) => normalizeText(p).split(/\s+/).filter(Boolean))
  );
  serviceWords.add(categoryNeedle);

  const tokens = remainder
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !serviceWords.has(t));

  const result = tokens.join(" ").trim();
  return result.length >= 2 ? result : null;
}

export async function parseSearchQuery(query: string): Promise<SearchFilters> {
  const fallback = parseSearchFallback(query);
  if (fallback.service || !process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const { chatCompletion } = await import("./openai");
  const jsonSchema = `{
  "service": "one of: ${SERVICE_CATEGORIES.join(", ")} or null",
  "sort": "rating or price or null",
  "minPrice": number or null,
  "maxPrice": number or null,
  "minRating": number or null,
  "maxDistance": number or null,
  "availability": "today or tomorrow or null"
}`;

  const aiResult = await chatCompletion(
    `Extract search filters from natural language home service queries. Return ONLY valid JSON matching: ${jsonSchema}`,
    query,
    150
  );

  if (aiResult) {
    try {
      const parsed = JSON.parse(aiResult.replace(/```json\n?|\n?```/g, "")) as SearchFilters;
      return { ...parseSearchFallback(query), ...parsed };
    } catch {
      // fall through
    }
  }

  return parseSearchFallback(query);
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.service) params.set("service", filters.service);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.maxDistance) params.set("maxDistance", String(filters.maxDistance));
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.q) params.set("q", filters.q);
  return params;
}

export function buildRedirectParams(query: string, filters: SearchFilters): URLSearchParams {
  const params = filtersToSearchParams(filters);
  if (query.trim()) params.set("q", query.trim());
  return params;
}
