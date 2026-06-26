"use client";

function HighlightName({ name, terms }: { name: string; terms: string[] }) {
  if (!terms.length) return <>{name}</>;
  const lowerName = name.toLowerCase();
  const term = terms.find((t) => t.length >= 2 && lowerName.includes(t.toLowerCase()));
  if (!term) return <>{name}</>;
  const idx = lowerName.indexOf(term.toLowerCase());
  if (idx < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="rounded bg-yellow-100 px-0.5 font-semibold text-gray-900">
        {name.slice(idx, idx + term.length)}
      </mark>
      {name.slice(idx + term.length)}
    </>
  );
}

type SearchResultCardProps = {
  name: string;
  role: "provider" | "customer";
  services: string[];
  ratingAvg: number;
  reviewCount: number;
  location?: string;
  matchedTerms: string[];
  approved?: boolean;
  onViewProfile?: () => void;
  onMessage: () => void;
  onHire?: () => void;
  compact?: boolean;
};

export function SearchResultCard({
  name,
  role,
  services,
  ratingAvg,
  reviewCount,
  location,
  matchedTerms,
  approved = true,
  onViewProfile,
  onMessage,
  onHire,
  compact,
}: SearchResultCardProps) {
  return (
    <div
      role={onViewProfile ? "button" : undefined}
      tabIndex={onViewProfile ? 0 : undefined}
      onClick={(e) => {
        if (!onViewProfile) return;
        if ((e.target as HTMLElement).closest("button, a")) return;
        onViewProfile();
      }}
      onKeyDown={(e) => {
        if (!onViewProfile) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        if ((e.target as HTMLElement).closest("button, a")) return;
        e.preventDefault();
        onViewProfile();
      }}
      className={`flex flex-col gap-2 rounded-xl border border-gray-100 bg-white transition hover:border-green-200 hover:bg-green-50/40 ${
        onViewProfile ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-500" : ""
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">
            <HighlightName name={name} terms={matchedTerms} />
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                role === "provider"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {role === "provider" ? "Provider" : "Customer"}
            </span>
            {role === "provider" &&
              (reviewCount > 0 ? (
                <span className="text-amber-600">
                  ★ {ratingAvg.toFixed(1)} • {reviewCount}{" "}
                  {reviewCount === 1 ? "review" : "reviews"}
                </span>
              ) : (
                <span className="text-gray-500">No reviews yet</span>
              ))}
            {location && <span className="text-gray-500">{location}</span>}
          </div>
        </div>
      </div>

      {role === "provider" && services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {services.slice(0, 4).map((s) => (
            <span key={s} className="badge-tag text-xs">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {role === "provider" && onViewProfile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="btn-secondary px-3 py-1 text-xs"
          >
            View Profile
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
          }}
          className="btn-secondary px-3 py-1 text-xs"
        >
          Message
        </button>
        {role === "provider" && approved && onHire && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHire();
            }}
            className="btn-primary px-3 py-1 text-xs"
          >
            Hire
          </button>
        )}
      </div>
    </div>
  );
}

export { HighlightName };
