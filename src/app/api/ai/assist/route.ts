import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guessServiceFromIntent } from "@/lib/ai/intent";
import { getDemoProviderCards } from "@/lib/demo/providers";
import { toProviderCardData, rankProviders } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const intent = await guessServiceFromIntent(message);
    const service = intent.service;

    let top = getDemoProviderCards(service, 3);

    try {
      const supabase = await createClient();
      let query = supabase
        .from("providers")
        .select("*, users(name, email, avatar_url)")
        .eq("approved", true);

      if (service) {
        query = query.contains("services", [service]);
      }

      const { data: providers } = await query;
      if (providers && providers.length > 0) {
        const ranked = rankProviders(providers, service);
        top = ranked.slice(0, 3).map(toProviderCardData);
      }
    } catch {
      // Supabase unavailable — demo cards already loaded
    }

    return NextResponse.json({
      message: intent.reply,
      service,
      providers: top,
      fallback: intent.fallback,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
