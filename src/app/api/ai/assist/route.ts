import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guessServiceFromIntent } from "@/lib/ai/intent";
import { toProviderCardData, rankProviders } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const intent = await guessServiceFromIntent(message);
    const service = intent.service;

    const supabase = await createClient();
    let query = supabase
      .from("providers")
      .select("*, users(name, email, avatar_url)")
      .eq("approved", true);

    if (service) {
      query = query.contains("services", [service]);
    }

    const { data: providers } = await query;
    const ranked = rankProviders(providers ?? [], service);
    const top = ranked.slice(0, 3).map(toProviderCardData);

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
