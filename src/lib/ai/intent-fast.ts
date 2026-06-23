import { SERVICE_CATEGORIES } from "@/lib/constants";
import { parseSearchFallback } from "./parse-search";

const KEYWORDS: Record<string, string[]> = {
  Plumber: ["leak", "pipe", "sink", "toilet", "plumb", "drain", "faucet", "water", "clog", "explod", "burst", "overflow"],
  Electrician: ["electric", "wire", "outlet", "light", "power", "circuit", "breaker", "flicker", "ac", "hvac", "air condition", "cooling"],
  "House Cleaning": ["clean", "maid", "dust", "sanitize", "housekeeping", "messy"],
  "Carpet Cleaning": ["carpet", "rug", "stain"],
  Painting: ["paint", "wall", "color", "peel"],
  Cooking: ["cook", "chef", "meal", "dinner", "party"],
  "Car Mechanic": ["car", "auto", "engine", "vehicle", "brake"],
  "Computer Repair": ["computer", "laptop", "pc", "wifi", "slow", "ac", "hvac", "air condition", "broken ac"],
  "Lawn Mowing": ["lawn", "grass", "yard", "mow"],
  "House Shifting": ["move", "shift", "relocate", "moving"],
};

function guessService(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category;
  }
  return SERVICE_CATEGORIES.find((c) => lower.includes(c.toLowerCase()));
}

function fallbackReply(message: string, service?: string): string {
  if (!service) {
    return "I'd be happy to help! Could you describe the issue in a bit more detail? For example, mention if it's plumbing, electrical, cleaning, or something else.";
  }
  const lower = message.toLowerCase();
  if (/urgent|badly|emergency|asap/.test(lower)) {
    return `That sounds urgent! Based on what you described, I recommend a **${service}**. Here are our top-rated available pros who can help quickly:`;
  }
  return `Got it — this looks like a **${service}** job. Here are the best matches based on ratings, price, and availability near you:`;
}

export function guessServiceFromKeywords(message: string): string | undefined {
  return guessService(message);
}

/** Synchronous intent — no OpenAI, no network. Used by assist API for instant responses. */
export function resolveIntentFast(message: string) {
  const service = guessService(message) ?? parseSearchFallback(message).service;
  return {
    service,
    reply: fallbackReply(message, service),
    fallback: true,
  };
}
