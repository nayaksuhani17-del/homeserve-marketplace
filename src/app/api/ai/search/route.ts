import { NextResponse } from "next/server";
import { parseSearchQuery, filtersToSearchParams } from "@/lib/ai/parse-search";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const filters = await parseSearchQuery(query);
    const params = filtersToSearchParams(filters);
    const redirectUrl = `/customer/dashboard?${params.toString()}`;

    const applied: string[] = [];
    if (filters.service) applied.push(`Service: ${filters.service}`);
    if (filters.sort === "price") applied.push("Sorted by lowest price");
    if (filters.minRating) applied.push(`${filters.minRating}+ stars`);
    if (filters.maxPrice) applied.push(`Under $${filters.maxPrice}/hr`);
    if (filters.maxDistance) applied.push(`Within ${filters.maxDistance} miles`);
    if (filters.availability) applied.push(`Available ${filters.availability}`);

    return NextResponse.json({
      filters,
      redirectUrl,
      summary: applied.length
        ? `Applied: ${applied.join(" · ")}`
        : "Showing all available providers",
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse search" }, { status: 500 });
  }
}
