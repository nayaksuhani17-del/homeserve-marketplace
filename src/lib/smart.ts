import type { PricingType } from "./pricing";
import { estimateBookingCost } from "./pricing";

const URGENCY_PATTERN = /\b(asap|urgent|urgently|emergency|immediately|right now|today)\b/i;

export function detectUrgency(text: string): boolean {
  return URGENCY_PATTERN.test(text);
}

export function suggestBestTimeToday(availableToday: boolean): string {
  if (!availableToday) return "Next available: tomorrow morning";
  const hour = new Date().getHours();
  if (hour < 11) return "Best slot today: 11:00 AM – 1:00 PM";
  if (hour < 14) return "Best slot today: 2:00 PM – 4:00 PM";
  if (hour < 17) return "Best slot today: 5:00 PM – 7:00 PM";
  return "Limited slots — book early tomorrow";
}

export type PriceBreakdownLine = { label: string; amount: number };

export function getPriceBreakdown(
  pricingType: PricingType,
  price: number,
  basePrice: number,
  hourlyRate: number,
  hours: number
): PriceBreakdownLine[] {
  if (pricingType === "fixed") {
    return [{ label: "Fixed job rate", amount: Math.round(price) }];
  }
  if (pricingType === "hourly") {
    const labor = Math.round(hourlyRate * hours);
    return [
      { label: "Service call fee", amount: Math.round(basePrice) },
      { label: `Labor (${hours}h × $${Math.round(hourlyRate)})`, amount: labor },
    ];
  }
  const est = estimateBookingCost("estimate", price, hours);
  return [
    { label: "Starting estimate", amount: Math.round(price * 0.4) },
    { label: `Job scope (${hours}h)`, amount: est - Math.round(price * 0.4) },
  ];
}

export function generateBehavioralInsights(input: {
  services: string[];
  rating_avg: number;
  jobs_completed?: number | null;
  available_today?: boolean | null;
  response_time_mins?: number | null;
  reviews: Array<{ rating: number; comment: string }>;
}): string[] {
  const insights: string[] = [];
  const text = input.reviews.map((r) => r.comment.toLowerCase()).join(" ");

  if (/punctual|on time|early|prompt/.test(text)) {
    insights.push("Customers love their punctuality");
  }
  if (/professional|courteous|polite|friendly/.test(text)) {
    insights.push("Known for professional, friendly service");
  }
  if (/emergency|urgent|same.?day|quick|fast/.test(text) || input.available_today) {
    insights.push("Often booked for emergency & same-day jobs");
  }
  if (/clean|tidy|spotless/.test(text)) {
    insights.push("Leaves the workspace spotless");
  }
  if (Number(input.rating_avg) >= 4.7) {
    insights.push("Consistently earns 5-star feedback");
  }
  if ((input.jobs_completed ?? 0) >= 80) {
    insights.push("Trusted by dozens of repeat customers");
  }
  if ((input.response_time_mins ?? 999) <= 20) {
    insights.push("Responds quickly to new requests");
  }

  if (insights.length === 0) {
    insights.push(`Popular choice for ${input.services[0]?.toLowerCase() ?? "home services"}`);
    insights.push("Highly rated by local customers");
  }

  return insights.slice(0, 3);
}

export const FAVORITES_KEY = "homeserve-favorites";
export const RECENT_KEY = "homeserve-recent-providers";
export const CLICKS_KEY = "homeserve-provider-clicks";

export function loadFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function trackRecentProvider(providerId: string) {
  const prev = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  const next = [providerId, ...prev.filter((id) => id !== providerId)].slice(0, 12);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function loadRecentProviderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function incrementProviderClick(providerId: string) {
  const map = JSON.parse(localStorage.getItem(CLICKS_KEY) ?? "{}") as Record<string, number>;
  map[providerId] = (map[providerId] ?? 0) + 1;
  localStorage.setItem(CLICKS_KEY, JSON.stringify(map));
}

export function loadProviderClickCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CLICKS_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}
