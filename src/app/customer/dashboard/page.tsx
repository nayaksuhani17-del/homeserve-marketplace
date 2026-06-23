import Link from "next/link";
import { ProviderCard } from "@/components/ProviderCard";
import { ReviewForm } from "@/components/ReviewForm";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { ProviderPagination } from "@/components/ProviderPagination";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { filterDemoProviders, applyDemoFilters } from "@/lib/demo/providers";
import { rankProviders } from "@/lib/providers";
import type { ProviderWithUser } from "@/lib/types";

type SearchParams = {
  service?: string;
  sort?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  maxDistance?: string;
  availability?: string;
  status?: string;
  page?: string;
};

type CustomerDashboardProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CustomerDashboard({
  searchParams,
}: CustomerDashboardProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("providers")
    .select("*, users(name, email, avatar_url)")
    .eq("approved", true);

  if (params.service) {
    query = query.contains("services", [params.service]);
  }

  if (params.q) {
    query = query.or(
      `location.ilike.%${params.q}%,description.ilike.%${params.q}%`
    );
  }

  if (params.minPrice) {
    query = query.gte("hourly_rate", Number(params.minPrice));
  }
  if (params.maxPrice && Number(params.maxPrice) < 120) {
    query = query.lte("hourly_rate", Number(params.maxPrice));
  }
  if (params.minRating) {
    query = query.gte("rating_avg", Number(params.minRating));
  }
  if (params.maxDistance) {
    query = query.lte("distance_miles", Number(params.maxDistance));
  }
  if (params.availability === "today") {
    query = query.eq("available_today", true);
  }
  if (params.availability === "tomorrow") {
    query = query.eq("available_tomorrow", true);
  }

  if (params.sort === "price") {
    query = query.order("hourly_rate", { ascending: true });
  } else {
    query = query.order("rating_avg", { ascending: false });
  }

  const { data: providers } = await query;
  let providerList = (providers ?? []) as ProviderWithUser[];
  let demoResult = null;

  if (providerList.length === 0) {
    demoResult = filterDemoProviders(params);
    providerList = demoResult.providers;
  }

  const stats = demoResult?.stats;
  const totalCount = demoResult?.total ?? providerList.length;
  const topRanked = rankProviders(
    demoResult ? applyDemoFilters(params) : providerList,
    params.service
  ).slice(0, 3);
  const topRankMap = new Map(topRanked.map((p, i) => [p.id, i + 1]));

  const { data: bookings } = user
    ? await supabase
        .from("bookings")
        .select("id, service, date, time, status, provider_id, providers(users(name))")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const activeFilters = [
    params.service && `Service: ${params.service}`,
    params.status === "verified" && "Verified only",
    params.status === "pending" && "Pending review",
    params.minRating && `${params.minRating}+ stars`,
    params.maxPrice && Number(params.maxPrice) < 120 && `Under $${params.maxPrice}/hr`,
    params.availability && `Available ${params.availability}`,
    params.maxDistance && `Within ${params.maxDistance} mi`,
  ].filter((f): f is string => Boolean(f));

  const paginationParams = {
    service: params.service,
    sort: params.sort,
    q: params.q,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    maxDistance: params.maxDistance,
    availability: params.availability,
    status: params.status,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Find a provider
          </h1>
          {stats ? (
            <p className="mt-1 text-gray-600">
              {totalCount.toLocaleString()} matching · {stats.total.toLocaleString()} total on
              platform ·{" "}
              <span className="font-medium text-green-700">{stats.verified.toLocaleString()} verified</span>
              {" · "}
              <span className="font-medium text-amber-700">{stats.pending.toLocaleString()} pending review</span>
            </p>
          ) : (
            <p className="mt-1 text-gray-600">
              {providerList.length} verified pros ready to help near you.
            </p>
          )}
        </div>
        {!user && (
          <Link href="/login" className="btn-primary">
            Log in to book
          </Link>
        )}
      </div>

      <div className="mt-8">
        <SmartSearchBar />
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span key={f} className="badge-tag">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <AdvancedFilters
          service={params.service}
          sort={params.sort ?? "rating"}
          q={params.q}
          minPrice={params.minPrice}
          maxPrice={params.maxPrice}
          minRating={params.minRating}
          maxDistance={params.maxDistance}
          availability={params.availability}
          status={params.status}
        />
      </div>

      {providerList.length > 0 ? (
        <>
          {topRankMap.size > 0 && !params.sort && (
            <p className="mt-8 text-sm font-medium text-green-700">
              ⭐ Top 3 picks highlighted below
            </p>
          )}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {providerList.map((provider) => {
              const rank = topRankMap.get(provider.id);
              const isTop = rank !== undefined;
              return (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  selectedService={params.service}
                  showHire={!!user}
                  isTopRated={isTop && !params.sort}
                  rank={rank}
                />
              );
            })}
          </div>
          {demoResult && (
            <ProviderPagination
              page={demoResult.page}
              totalPages={demoResult.totalPages}
              total={demoResult.total}
              searchParams={paginationParams}
            />
          )}
        </>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No providers found"
            description="Try adjusting your filters or search for a different service. Our AI search understands natural language!"
            icon="🏠"
            action={
              <Link href="/customer/dashboard" className="btn-primary inline-block">
                Clear filters
              </Link>
            }
          />
        </div>
      )}

      {user && bookings && bookings.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Your bookings</h2>
          <div className="mt-4 space-y-4">
            {bookings.map((booking) => {
              const provider = booking.providers as {
                users?: { name?: string } | { name?: string }[] | null;
              } | null;
              const providerUser = provider?.users;
              const providerName = Array.isArray(providerUser)
                ? providerUser[0]?.name
                : providerUser?.name;

              return (
                <div key={booking.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {providerName ?? "Provider"} — {booking.service}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.date}
                        {booking.time ? ` at ${booking.time}` : ""} ·{" "}
                        <span
                          className={
                            booking.status === "confirmed"
                              ? "text-green-600"
                              : "text-amber-500"
                          }
                        >
                          {booking.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ReviewForm providerId={booking.provider_id} bookingId={booking.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
