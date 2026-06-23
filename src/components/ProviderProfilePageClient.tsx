"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderProfileClient } from "@/components/ProviderProfileClient";
import { useMockApp } from "@/context/MockAppContext";
import { mockProviderToLegacy } from "@/lib/mock/operations";

export function ProviderProfilePageClient({ providerId }: { providerId: string }) {
  const { getProvider, getProviderReviews, user, ready, trackProviderView } = useMockApp();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (providerId && ready) trackProviderView(providerId);
  }, [providerId, ready, trackProviderView]);

  const autoOpenHire = Boolean(
    user &&
      (searchParams.get("hire") === "1" || searchParams.get("rebook") === "1")
  );
  const quickRebook = searchParams.get("quick") === "1";

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const provider = getProvider(providerId);

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

  const defaultService = searchParams.get("service") || provider.services[0] || "General";
  const reviews = getProviderReviews(providerId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/customer/dashboard" className="link-brand text-sm">
        ← Back to providers
      </Link>
      <div className="mt-6">
        <ProviderProfileClient
          provider={mockProviderToLegacy(provider)}
          reviews={reviews}
          defaultService={defaultService}
          isLoggedIn={!!user}
          autoOpenHire={autoOpenHire}
          quickRebook={quickRebook}
        />
      </div>
    </div>
  );
}
