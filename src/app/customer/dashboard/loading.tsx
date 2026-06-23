import { ProviderGridSkeleton } from "@/components/Skeleton";

export default function CustomerDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-gray-200" />
      <div className="card mt-8 h-48 animate-pulse bg-gray-100" />
      <div className="mt-8">
        <ProviderGridSkeleton />
      </div>
    </div>
  );
}
