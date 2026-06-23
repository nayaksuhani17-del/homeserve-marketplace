import Link from "next/link";
import dynamic from "next/dynamic";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { HomeStats } from "@/components/HomeStats";
import { HomeDemoButtons } from "@/components/DemoSwitcher";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { getServiceMeta } from "@/lib/services";

const SmartAssistant = dynamic(
  () => import("@/components/SmartAssistant").then((m) => m.SmartAssistant),
  {
    loading: () => (
      <div className="card h-64 animate-pulse bg-gradient-to-b from-gray-50 to-white" />
    ),
  }
);

const FEATURES = [
  {
    icon: "✓",
    title: "Verified providers",
    desc: "Every pro is background-checked and approved before joining the platform.",
  },
  {
    icon: "⚡",
    title: "Book in minutes",
    desc: "See upfront pricing, pick a time slot, and confirm — all in one flow.",
  },
  {
    icon: "★",
    title: "Trusted reviews",
    desc: "Real ratings from homeowners help you choose with confidence.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-green-100 to-white px-6 py-14 shadow-sm sm:px-12 sm:py-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-green-100/60 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="badge-verified">✓ Verified pros</span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-green-800 ring-1 ring-green-200">
              Trusted by homeowners
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Find Trusted Home Services Instantly
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            Search local pros, compare ratings and prices, and book the right provider in
            seconds — plumbing, cleaning, electrical, and more.
          </p>

          <div className="mt-8 max-w-2xl">
            <SmartSearchBar placeholder="Search for a service, e.g. Plumber" />
          </div>

          <HomeDemoButtons />
        </div>
      </section>

      <HomeStats />

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Browse by category</h2>
            <p className="mt-1 text-sm text-gray-500">Popular home services near you</p>
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

      <section className="mt-12">
        <SmartAssistant />
      </section>
    </div>
  );
}
