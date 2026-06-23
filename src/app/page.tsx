import Link from "next/link";
import { SmartAssistant } from "@/components/SmartAssistant";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SERVICE_CATEGORIES } from "@/lib/constants";

const FEATURES = [
  {
    icon: "✨",
    title: "AI-powered matching",
    desc: "Describe your problem in plain English — our assistant finds the right pro instantly.",
  },
  {
    icon: "✓",
    title: "Verified providers",
    desc: "Every provider is reviewed and approved by our team before going live.",
  },
  {
    icon: "⚡",
    title: "Book in seconds",
    desc: "See pricing upfront, pick a time, and confirm — no payment needed for this demo.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-green-100 to-white px-6 py-16 shadow-sm sm:px-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-green-100/60 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-green-700">AI-powered marketplace</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
            Home services, matched intelligently
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            Tell us what you need. Our smart assistant finds verified local pros —
            ranked by rating, price, and availability.
          </p>
          <div className="mt-8 max-w-2xl">
            <SmartSearchBar placeholder="Try: cheap plumber near me available today" />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <SmartAssistant />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Browse by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SERVICE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/customer/dashboard?service=${encodeURIComponent(category)}`}
              className="card card-hover px-4 py-5 text-center text-sm font-medium text-gray-800"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((item) => (
          <div key={item.title} className="card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">
              {item.icon}
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
