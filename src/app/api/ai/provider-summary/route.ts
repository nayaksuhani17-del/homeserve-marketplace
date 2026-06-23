import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { generateProviderSummary } from "@/lib/ai/summaries";
import { getDemoProviderById } from "@/lib/demo/providers";
import { getProviderUser } from "@/lib/providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const demo = getDemoProviderById(id);
  if (demo) {
    const summary = await generateProviderSummary({
      name: demo.users.name,
      services: demo.services,
      rating_avg: Number(demo.rating_avg),
      hourly_rate: Number(demo.hourly_rate),
      years_experience: demo.years_experience,
      jobs_completed: demo.jobs_completed,
      description: demo.description,
    });
    return NextResponse.json({ summary });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*, users(name)")
    .eq("id", id)
    .single();

  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = getProviderUser(provider as Parameters<typeof getProviderUser>[0]);
  const summary = await generateProviderSummary({
    name: user?.name ?? "Provider",
    services: provider.services ?? [],
    rating_avg: Number(provider.rating_avg),
    hourly_rate: Number(provider.hourly_rate),
    years_experience: provider.years_experience,
    jobs_completed: provider.jobs_completed,
    description: provider.description,
  });

  return NextResponse.json({ summary });
}
