export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200/80 ${className}`}
      aria-hidden
    />
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-1/3" />
      <Skeleton className="mt-3 h-12 w-full" />
      <div className="mt-auto flex justify-between pt-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function ProviderGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}
