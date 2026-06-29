import Link from "next/link";
import dynamic from "next/dynamic";
import { BrandLockup } from "@/components/BrandName";
import { BRAND_TAGLINE } from "@/lib/brand";
import { HomeStats } from "@/components/HomeStats";
import { HomeDemoButtons } from "@/components/DemoSwitcher";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getServiceMeta } from "@/lib/services";

const AiHelpSearch = dynamic(
  () => import("@/components/AiHelpSearch").then((m) => m.AiHelpSearch),
  {
    loading: () => (
      <div className="mb-8 h-16 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
    ),
  }
);

export default function HomePage() {
  return (
    <div className="page-shell space-y-12">
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-8 sm:px-10 sm:py-10">
        <BrandLockup size="hero" align="start" />
        <h1 className="page-title mt-5 max-w-2xl font-light tracking-wide text-gray-700">
          {BRAND_TAGLINE}
        </h1>
        <p className="page-desc mt-3 max-w-xl">
          Compare verified pros, see pricing upfront, and book with confidence.
        </p>
        <HomeStats inline />
        <div className="mt-8">
          <HomeDemoButtons />
        </div>
      </section>

      <AiHelpSearch />

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Browse by category</h2>
            <p className="section-desc">Jump straight to a service type</p>
          </div>
          <Link href="/customer/dashboard" className="link-brand hidden text-sm sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {SERVICE_CATEGORIES.map((category) => {
            const meta = getServiceMeta(category);
            return (
              <Link
                key={category}
                href={`/customer/dashboard?service=${encodeURIComponent(category)}`}
                className="rounded-xl border border-gray-200 bg-white px-3 py-4 text-center transition hover:border-green-200 hover:bg-green-50/30"
              >
                <span className="text-2xl" aria-hidden>
                  {meta.icon}
                </span>
                <p className="mt-1.5 text-sm font-medium text-gray-800">{category}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
