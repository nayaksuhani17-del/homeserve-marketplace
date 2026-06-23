import { SERVICE_CATEGORIES } from "./constants";

export type ServiceMeta = {
  icon: string;
  description: string;
  slug: string;
};

export const SERVICE_META: Record<string, ServiceMeta> = {
  Painting: { icon: "🎨", description: "Interior & exterior paint jobs", slug: "painting" },
  Cooking: { icon: "🍳", description: "Personal chefs & meal prep", slug: "cooking" },
  "House Cleaning": { icon: "🧹", description: "Deep cleans & recurring service", slug: "cleaning" },
  "Carpet Cleaning": { icon: "🧼", description: "Steam cleaning & stain removal", slug: "carpet" },
  Electrician: { icon: "⚡", description: "Wiring, outlets & panel work", slug: "electrician" },
  Plumber: { icon: "🔧", description: "Leaks, drains & installations", slug: "plumber" },
  "Car Mechanic": { icon: "🚗", description: "Mobile repairs & diagnostics", slug: "mechanic" },
  "Computer Repair": { icon: "💻", description: "IT support & device fixes", slug: "computer" },
  "Lawn Mowing": { icon: "🌿", description: "Lawn care & yard cleanup", slug: "lawn" },
  "House Shifting": { icon: "📦", description: "Local moves & furniture delivery", slug: "moving" },
};

export const SEARCH_SUGGESTIONS = [
  "Plumber near me",
  "Cheap house cleaning",
  "Electrician available today",
  "Urgent leak repair ASAP",
  "Affordable painter",
  "Lawn mowing this weekend",
  "Computer repair near me",
  "Best rated cleaner",
];

export function getServiceMeta(service: string): ServiceMeta {
  return (
    SERVICE_META[service] ?? {
      icon: "🏠",
      description: "Local home services",
      slug: service.toLowerCase().replace(/\s+/g, "-"),
    }
  );
}

export function matchSearchSuggestions(query: string, limit = 5): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEARCH_SUGGESTIONS.slice(0, limit);

  const scored = SEARCH_SUGGESTIONS.map((s) => {
    const lower = s.toLowerCase();
    if (lower.startsWith(q)) return { s, score: 3 };
    if (lower.includes(q)) return { s, score: 2 };
    const words = q.split(/\s+/);
    const hits = words.filter((w) => lower.includes(w)).length;
    return { s, score: hits };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const fromCategories = SERVICE_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q)
  ).map((c) => `${c} near me`);

  const merged = [...scored.map((x) => x.s), ...fromCategories];
  return [...new Set(merged)].slice(0, limit);
}

export function similarServices(service?: string): string[] {
  if (!service) return ["House Cleaning", "Plumber", "Electrician"];
  const groups: Record<string, string[]> = {
    Plumber: ["Electrician", "House Cleaning"],
    Electrician: ["Plumber", "Computer Repair"],
    "House Cleaning": ["Carpet Cleaning", "Lawn Mowing"],
    "Carpet Cleaning": ["House Cleaning", "Painting"],
    Painting: ["House Cleaning", "House Shifting"],
    Cooking: ["House Cleaning", "House Shifting"],
    "Car Mechanic": ["Computer Repair", "Electrician"],
    "Computer Repair": ["Electrician", "Car Mechanic"],
    "Lawn Mowing": ["House Cleaning", "House Shifting"],
    "House Shifting": ["House Cleaning", "Painting"],
  };
  return groups[service] ?? ["House Cleaning", "Plumber"];
}
