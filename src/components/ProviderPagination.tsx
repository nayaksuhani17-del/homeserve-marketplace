import Link from "next/link";

type ProviderPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

function buildPageUrl(page: number, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/customer/dashboard${qs ? `?${qs}` : ""}`;
}

export function ProviderPagination({
  page,
  totalPages,
  total,
  searchParams,
}: ProviderPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-10 flex flex-col items-center gap-4" aria-label="Pagination">
      <p className="text-sm text-gray-500">
        Showing page {page} of {totalPages} ({total.toLocaleString()} providers)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {page > 1 && (
          <Link
            href={buildPageUrl(page - 1, searchParams)}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            ← Prev
          </Link>
        )}
        {pages.map((p) => (
          <Link
            key={p}
            href={buildPageUrl(p, searchParams)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors ${
              p === page
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-green-50"
            }`}
          >
            {p}
          </Link>
        ))}
        {page < totalPages && (
          <Link
            href={buildPageUrl(page + 1, searchParams)}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}
