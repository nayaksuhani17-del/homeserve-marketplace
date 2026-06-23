"use client";

import { SERVICE_CATEGORIES } from "@/lib/constants";

type AdvancedFiltersProps = {
  service?: string;
  sort: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  maxDistance?: string;
  availability?: string;
  status?: string;
  instant?: boolean;
  onApply?: (filters: {
    service?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    maxDistance?: string;
    availability?: string;
    status?: string;
  }) => void;
};

export function AdvancedFilters(props: AdvancedFiltersProps) {
  if (props.instant && props.onApply) {
    return <InstantFilters {...props} onApply={props.onApply} />;
  }

  return (
    <form method="get" className="card space-y-5 p-5">
      <FilterFields {...props} />
      <button type="submit" className="btn-primary">
        Apply filters
      </button>
    </form>
  );
}

function InstantFilters({
  onApply,
  ...props
}: AdvancedFiltersProps & {
  onApply: NonNullable<AdvancedFiltersProps["onApply"]>;
}) {
  function emit(form: HTMLFormElement) {
    const fd = new FormData(form);
    onApply({
      service: (fd.get("service") as string) || undefined,
      sort: (fd.get("sort") as string) || "rating",
      minPrice: (fd.get("minPrice") as string) || undefined,
      maxPrice: (fd.get("maxPrice") as string) || undefined,
      minRating: (fd.get("minRating") as string) || undefined,
      maxDistance: (fd.get("maxDistance") as string) || undefined,
      availability: (fd.get("availability") as string) || undefined,
      status: (fd.get("status") as string) || undefined,
    });
  }

  return (
    <form
      className="card space-y-5 p-5"
      onChange={(e) => emit(e.currentTarget)}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <a href="/customer/dashboard" className="link-brand text-xs">
          Clear all
        </a>
      </div>
      <FilterFields {...props} />
      <p className="text-xs text-gray-500">Filters apply instantly as you change them.</p>
    </form>
  );
}

function FilterFields(props: AdvancedFiltersProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="service" className="mb-1 block text-sm font-medium text-gray-700">
            Service
          </label>
          <select id="service" name="service" defaultValue={props.service ?? ""} className="input-field">
            <option value="">All services</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-sm font-medium text-gray-700">
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={props.sort} className="input-field">
            <option value="rating">Top Rated</option>
            <option value="price">Lowest Price</option>
            <option value="distance">Closest</option>
          </select>
        </div>

        <div>
          <label htmlFor="availability" className="mb-1 block text-sm font-medium text-gray-700">
            Availability
          </label>
          <select id="availability" name="availability" defaultValue={props.availability ?? ""} className="input-field">
            <option value="">Any time</option>
            <option value="today">Available today</option>
            <option value="tomorrow">Available tomorrow</option>
          </select>
        </div>

        <div>
          <label htmlFor="minRating" className="mb-1 block text-sm font-medium text-gray-700">
            Min rating
          </label>
          <select id="minRating" name="minRating" defaultValue={props.minRating ?? ""} className="input-field">
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxDistance" className="mb-1 block text-sm font-medium text-gray-700">
            Max distance (miles)
          </label>
          <select id="maxDistance" name="maxDistance" defaultValue={props.maxDistance ?? ""} className="input-field">
            <option value="">Any distance</option>
            <option value="3">Within 3 mi</option>
            <option value="5">Within 5 mi</option>
            <option value="10">Within 10 mi</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Verification
          </label>
          <select id="status" name="status" defaultValue={props.status ?? "verified"} className="input-field">
            <option value="verified">Verified only</option>
            <option value="all">All providers</option>
            <option value="pending">Pending review</option>
          </select>
        </div>

        {!props.instant && (
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-gray-700">
              Keywords
            </label>
            <input id="q" type="search" name="q" defaultValue={props.q ?? ""} placeholder="Location, keywords..." className="input-field" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-gray-700">
            Min price: ${props.minPrice || "15"}/hr
          </label>
          <input
            id="minPrice"
            type="range"
            name="minPrice"
            min={15}
            max={120}
            defaultValue={props.minPrice ?? 15}
            className="w-full accent-green-600"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-gray-700">
            Max price: ${props.maxPrice || "120"}/hr
          </label>
          <input
            id="maxPrice"
            type="range"
            name="maxPrice"
            min={15}
            max={120}
            defaultValue={props.maxPrice ?? 120}
            className="w-full accent-green-600"
          />
        </div>
      </div>
    </>
  );
}
