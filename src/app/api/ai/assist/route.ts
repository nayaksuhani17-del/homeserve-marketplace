import { NextResponse } from "next/server";
import { resolveIntentFast } from "@/lib/ai/intent-fast";
import { contextChips, parseAssistantContext } from "@/lib/ai/parse-intent";
import { getDemoProviderCards } from "@/lib/demo/providers";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const context = parseAssistantContext(message);
    const intent = resolveIntentFast(message);
    let top = getDemoProviderCards(context.service ?? intent.service, 3);

    const { isSupabaseConfigured } = await import("@/lib/supabase/config");
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const { rankProviders, toProviderCardData } = await import("@/lib/providers");
        const { assignRecommendationLabels } = await import("@/lib/recommendations");
        const supabase = await createClient();
        let query = supabase
          .from("providers")
          .select("*, users(name, email, avatar_url)")
          .eq("approved", true);

        const service = context.service ?? intent.service;
        if (service) {
          query = query.contains("services", [service]);
        }

        const { data: providers } = await query;
        if (providers && providers.length > 0) {
          const ranked = rankProviders(providers, service);
          const labels = assignRecommendationLabels(ranked.slice(0, 3));
          top = ranked.slice(0, 3).map((p) =>
            toProviderCardData(p, { recommendationLabel: labels.get(p.id) })
          );
        }
      } catch {
        // Demo cards already loaded
      }
    }

    const chips = contextChips(context);
    let reply = intent.reply;
    if (chips.length > 0) {
      reply += `\n\nLooking for: ${chips.join(" · ")}`;
    }

    return NextResponse.json({
      message: reply,
      service: context.service ?? intent.service,
      providers: top,
      chips,
      urgency: context.urgency,
      maxPrice: context.maxPrice,
      fallback: intent.fallback,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
