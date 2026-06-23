import { parseSearchFallback } from "./parse-search";
import { guessServiceFromKeywords } from "./intent-fast";

export type AssistantContext = {
  service?: string;
  maxPrice?: number;
  urgency?: "today" | "tomorrow" | "normal";
  sort?: "rating" | "price" | "distance";
};

export function parseAssistantContext(message: string): AssistantContext {
  const lower = message.toLowerCase();
  const filters = parseSearchFallback(message);
  const service = guessServiceFromKeywords(message) ?? filters.service;

  let urgency: AssistantContext["urgency"] = "normal";
  if (/today|asap|urgent|emergency|now|same day/.test(lower)) urgency = "today";
  else if (/tomorrow/.test(lower)) urgency = "tomorrow";

  let sort: AssistantContext["sort"] = filters.sort ?? "rating";
  if (/closest|near me|nearby/.test(lower)) sort = "distance";
  if (/cheap|affordable|budget|lowest/.test(lower)) sort = "price";

  return {
    service,
    maxPrice: filters.maxPrice,
    urgency,
    sort,
  };
}

export function contextChips(ctx: AssistantContext): string[] {
  const chips: string[] = [];
  if (ctx.service) chips.push(ctx.service);
  if (ctx.maxPrice) chips.push(`Under $${ctx.maxPrice}/hr`);
  if (ctx.urgency === "today") chips.push("Available today");
  if (ctx.urgency === "tomorrow") chips.push("Available tomorrow");
  if (ctx.sort === "price") chips.push("Budget-friendly");
  if (ctx.sort === "distance") chips.push("Closest first");
  return chips;
}
