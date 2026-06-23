import Link from "next/link";
import dynamic from "next/dynamic";
import { HomeStats } from "@/components/HomeStats";
import { HomeDemoButtons } from "@/components/DemoSwitcher";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getServiceMeta } from "@/lib/services";

const AiHelpSearch = dynamic(
  () => import("@/components/AiHelpSearch").then((m) => m.AiHelpSearch),
  {
    loading: () => (
      <div className="ai-panel-expanded mb-10 h-56 animate-pulse bg-gradient-to-br from-[#DCFCE7] to-white" />
    ),
  }
);

const FEATURES = [
  {
    icon: "✓",
    title: "Verified providers",
    desc: "Every professional is vetted and approved before joining the platform.",
  },
  {
    icon: "⚡",
    title: "Book in minutes",
    desc: "Transparent pricing, real-time availability, and one-click confirmation.",
  },
  {
    icon: "★",
    title: "Trusted reviews",
    desc: "Ratings and feedback from verified homeowners guide every match.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <AiHelpSearch />

      <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 px-6 py-10 shadow-sm sm:px-12 sm:py-12">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="badge-verified">Verified pros</span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-green-800 ring-1 ring-green-100">
                Trusted by homeowners nationwide
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              Trusted home services, matched intelligently
            </h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
              From urgent repairs to scheduled maintenance — compare verified local
              professionals, review pricing upfront, and book with confidence.
            </p>
          </div>
          <HomeDemoButtons />
        </div>
      </section>

      <HomeStats />

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Or explore the full marketplace manually
            </p>
          </div>
          <Link href="/customer/dashboard" className="link-brand hidden text-sm sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SERVICE_CATEGORIES.map((category) => {
            const meta = getServiceMeta(category);
            return (
              <Link
                key={category}
                href={`/customer/dashboard?service=${encodeURIComponent(category)}`}
                className="card card-hover bg-white px-4 py-5 text-center transition-transform hover:-translate-y-0.5"
              >
                <span className="text-3xl" aria-hidden>
                  {meta.icon}
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-800">{category}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((item) => (
          <div key={item.title} className="card bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl font-bold text-green-700">
              {item.icon}
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
