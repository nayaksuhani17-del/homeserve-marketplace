import { Suspense } from "react";
import { ProviderProfilePageClient } from "@/components/ProviderProfilePageClient";

type ProviderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProviderProfilePage({ params }: ProviderPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      }
    >
      <ProviderProfilePageClient providerId={id} />
    </Suspense>
  );
}
