import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReviewInsights } from "@/lib/ai/summaries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment")
    .eq("provider_id", id);

  const insights = await generateReviewInsights(reviews ?? []);
  return NextResponse.json(insights);
}
