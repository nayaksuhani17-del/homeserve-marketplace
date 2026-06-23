import { NextResponse } from "next/server";
import {
  filterDemoProviders,
  type DemoProviderFilters,
} from "@/lib/demo/providers";
import { assignRecommendationLabels } from "@/lib/recommendations";
import { toProviderCardData } from "@/lib/providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: DemoProviderFilters = {
    service: searchParams.get("service") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    minRating: searchParams.get("minRating") ?? undefined,
    maxDistance: searchParams.get("maxDistance") ?? undefined,
    availability: searchParams.get("availability") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  };

  const result = filterDemoProviders(filters);
  const labels = assignRecommendationLabels(result.topRanked);

  return NextResponse.json({
    providers: result.providers,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    stats: result.stats,
    topRankedIds: result.topRanked.map((p) => p.id),
    topRankMap: Object.fromEntries(
      result.topRanked.map((p, i) => [p.id, i + 1])
    ),
    labelMap: Object.fromEntries(labels),
    preview: result.topRanked.slice(0, 3).map((p) =>
      toProviderCardData(p, { recommendationLabel: labels.get(p.id) })
    ),
  });
}
