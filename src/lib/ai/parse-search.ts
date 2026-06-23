import { SERVICE_CATEGORIES } from "@/lib/constants";
import { chatCompletion } from "./openai";

export type SearchFilters = {
  service?: string;
  sort?: "rating" | "price";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  availability?: "today" | "tomorrow";
  q?: string;
};

const KEYWORDS: Record<string, string[]> = {
  Plumber: ["leak", "pipe", "sink", "toilet", "plumb", "drain", "faucet", "water"],
  Electrician: ["electric", "wire", "outlet", "light", "power", "circuit", "breaker"],
  "House Cleaning": ["clean", "maid", "dust", "sanitize", "housekeeping"],
  "Carpet Cleaning": ["carpet", "rug", "stain", "upholstery"],
  Painting: ["paint", "wall", "color", "brush"],
  Cooking: ["cook", "chef", "meal", "kitchen", "dinner", "catering"],
  "Car Mechanic": ["car", "auto", "engine", "vehicle", "brake", "oil change"],
  "Computer Repair": ["computer", "laptop", "pc", "wifi", "tech", "virus"],
  "Lawn Mowing": ["lawn", "grass", "yard", "mow", "garden"],
  "House Shifting": ["move", "shift", "relocate", "moving", "movers"],
};

function guessService(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category;
  }
  return SERVICE_CATEGORIES.find((c) => lower.includes(c.toLowerCase()));
}

export function parseSearchFallback(query: string): SearchFilters {
  const lower = query.toLowerCase();
  const filters: SearchFilters = {};

  filters.service = guessService(query);

  if (/cheap|affordable|budget|lowest price|inexpensive/.test(lower)) {
    filters.sort = "price";
    filters.maxPrice = 45;
  }
  if (/best rated|top rated|highly rated|best/.test(lower)) {
    filters.sort = "rating";
    filters.minRating = 4;
  }
  if (/4\+?\s*star|four star|4 star/.test(lower)) {
    filters.minRating = 4;
  }
  if (/near me|nearby|close|local/.test(lower)) {
    filters.maxDistance = 5;
  }
  if (/today|same day|asap|urgent|now/.test(lower)) {
    filters.availability = "today";
  }
  if (/tomorrow/.test(lower)) {
    filters.availability = "tomorrow";
  }

  const priceMatch = lower.match(/under \$(\d+)|below \$(\d+)|less than \$(\d+)/);
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[1] || priceMatch[2] || priceMatch[3]);
  }

  return filters;
}

export async function parseSearchQuery(query: string): Promise<SearchFilters> {
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
