import { SERVICE_CATEGORIES } from "@/lib/constants";
import { chatCompletion } from "./openai";
import { parseSearchFallback } from "./parse-search";

const KEYWORDS: Record<string, string[]> = {
  Plumber: ["leak", "pipe", "sink", "toilet", "plumb", "drain", "faucet", "water", "clog", "explod", "burst", "overflow"],
  Electrician: ["electric", "wire", "outlet", "light", "power", "circuit", "breaker", "flicker"],
  "House Cleaning": ["clean", "maid", "dust", "sanitize", "housekeeping", "messy"],
  "Carpet Cleaning": ["carpet", "rug", "stain"],
  Painting: ["paint", "wall", "color", "peel"],
  Cooking: ["cook", "chef", "meal", "dinner", "party"],
  "Car Mechanic": ["car", "auto", "engine", "vehicle", "brake"],
  "Computer Repair": ["computer", "laptop", "pc", "wifi", "slow"],
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

export async function guessServiceFromIntent(message: string) {
  const fallbackService = guessService(message);

  const ai = await chatCompletion(
    `You are a friendly home services assistant. Given a user problem:
1. Pick the best service category from: ${SERVICE_CATEGORIES.join(", ")}
2. Write a warm 1-2 sentence reply acknowledging their issue and naming the service.

Return JSON only: {"service": "CategoryName", "reply": "your message"}`,
    message,
    120
  );

  if (ai) {
    try {
      const parsed = JSON.parse(ai.replace(/```json\n?|\n?```/g, "")) as {
        service?: string;
        reply?: string;
      };
      const service =
        SERVICE_CATEGORIES.find(
          (c) => c.toLowerCase() === parsed.service?.toLowerCase()
        ) ?? fallbackService;

      return {
        service,
        reply: parsed.reply ?? fallbackReply(message, service),
        fallback: false,
      };
    } catch {
      // fall through
    }
  }

  const service = fallbackService ?? parseSearchFallback(message).service;
  return {
    service,
    reply: fallbackReply(message, service),
    fallback: true,
  };
}
