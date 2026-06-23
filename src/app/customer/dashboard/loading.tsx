import { Skeleton } from "@/components/Skeleton";

export default function CustomerDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-in">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-5 w-96" />
      <Skeleton className="mt-8 h-12 w-full rounded-xl" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
