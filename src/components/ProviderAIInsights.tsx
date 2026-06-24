"use client";

import { useMemo } from "react";
import { generateProviderSummaryFallback, generateReviewInsightsFallback } from "@/lib/ai/summaries";
import { generateBehavioralInsights } from "@/lib/smart";
import type { PricingType } from "@/lib/pricing";

type ProviderAISummaryProps = {
  provider: {
    name: string;
    services: string[];
    rating_avg: number;
    pricing_type: PricingType;
    price: number;
    years_experience?: number | null;
    jobs_completed?: number | null;
    description?: string;
  };
};

export function ProviderAISummary({ provider }: ProviderAISummaryProps) {
  const summary = useMemo(
    () =>
      generateProviderSummaryFallback({
        name: provider.name,
        services: provider.services,
        rating_avg: provider.rating_avg,
        pricing_type: provider.pricing_type,
        price: provider.price,
        years_experience: provider.years_experience,
        jobs_completed: provider.jobs_completed,
        description: provider.description,
      }),
    [provider]
  );

  return (
    <div className="card border-green-100 bg-green-50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <span>✨</span> Profile summary
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{summary}</p>
    </div>
  );
}

type BehavioralInsightsProps = {
  provider: {
    services: string[];
    rating_avg: number;
    jobs_completed?: number | null;
    available_today?: boolean | null;
    response_time_mins?: number | null;
  };
  reviews: Array<{ rating: number; comment: string }>;
};

export function BehavioralInsightsPanel({ provider, reviews }: BehavioralInsightsProps) {
  const insights = useMemo(
    () =>
      generateBehavioralInsights({
        services: provider.services,
        rating_avg: provider.rating_avg,
        jobs_completed: provider.jobs_completed,
        available_today: provider.available_today,
        response_time_mins: provider.response_time_mins,
        reviews,
      }),
    [provider, reviews]
  );

  return (
    <div className="card border-indigo-100 bg-indigo-50/50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
        <span>🧠</span> Profile highlights
      </div>
      <ul className="mt-3 space-y-2">
        {insights.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-indigo-900">
            <span className="text-indigo-500">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

type ReviewInsightsPanelProps = {
  reviews: Array<{ rating: number; comment: string }>;
};

export function ReviewInsightsPanel({ reviews }: ReviewInsightsPanelProps) {
  const insights = useMemo(() => generateReviewInsightsFallback(reviews), [reviews]);

  if (reviews.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 font-semibold text-gray-900">
        <span>✨</span> Customers love…
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">What people like</p>
          <ul className="mt-2 space-y-1">
            {insights.likes.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-green-700">
                <span>+</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Common notes</p>
          <ul className="mt-2 space-y-1">
            {insights.complaints.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-700">
                <span>·</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
