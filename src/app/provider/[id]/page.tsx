import Link from "next/link";
import { ProviderProfileClient } from "@/components/ProviderProfileClient";
import { createClient } from "@/lib/supabase/server";
import { getDemoProviderById, getDemoReviewsForProvider } from "@/lib/demo/providers";

type ProviderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string; hire?: string }>;
};

export default async function ProviderProfilePage({
  params,
  searchParams,
}: ProviderPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  let provider = (
    await supabase
      .from("providers")
      .select("*, users(name, email, avatar_url)")
      .eq("id", id)
      .single()
  ).data;

  if (!provider) {
    provider = getDemoProviderById(id) ?? null;
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Provider not found</h1>
        <Link href="/customer/dashboard" className="link-brand mt-4 inline-block">
          ← Back to search
        </Link>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: dbReviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, users(name)")
    .eq("provider_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const reviews =
    dbReviews && dbReviews.length > 0 ? dbReviews : getDemoReviewsForProvider(id);

  const defaultService = sp.service || provider.services?.[0] || "General";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/customer/dashboard"
        className="link-brand text-sm"
      >
        ← Back to providers
      </Link>

      <div className="mt-6">
        <ProviderProfileClient
          provider={provider}
          reviews={reviews}
          defaultService={defaultService}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
