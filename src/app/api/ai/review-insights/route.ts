import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { generateReviewInsights } from "@/lib/ai/summaries";
import { getDemoReviewsForProvider } from "@/lib/demo/providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const demoReviews = getDemoReviewsForProvider(id);
  if (demoReviews.length > 0) {
    const insights = await generateReviewInsights(demoReviews);
    return NextResponse.json(insights);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ likes: ["No reviews yet"], complaints: ["Not enough data"] });
  }

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment")
    .eq("provider_id", id);

  const insights = await generateReviewInsights(reviews ?? []);
  return NextResponse.json(insights);
}
