"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { EmptyState } from "@/components/EmptyState";
import { useMockApp } from "@/context/MockAppContext";
import { hasCustomerRole } from "@/lib/user-capabilities";
import { mockProviderToLegacy } from "@/lib/mock/operations";

export function SavedProvidersClient() {
  const router = useRouter();
  const { user, ready, activeMode, getSavedProviders } = useMockApp();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?redirect=/customer/saved");
    else if (!hasCustomerRole(user) || activeMode !== "customer") {
      router.replace("/customer/dashboard");
    }
  }, [ready, user, activeMode, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  const saved = getSavedProviders();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/customer/dashboard" className="link-brand text-sm">
        ← Back to browse
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Saved providers</h1>
      <p className="mt-1 text-gray-600">
        Your favorite pros — book again in one tap.
      </p>

      {saved.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => (
            <ProviderCard
              key={p.id}
              provider={mockProviderToLegacy(p)}
              showHire
              recommendationLabel="best-match"
            />
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No saved providers yet"
            description="Tap the heart on any provider card to save them for quick access."
            icon="♥"
            action={
              <Link href="/customer/dashboard" className="btn-primary inline-block">
                Browse providers
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
