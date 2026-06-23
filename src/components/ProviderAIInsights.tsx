"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";

export function ProviderAISummary({ providerId }: { providerId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ai/provider-summary?id=${providerId}`)
      .then((r) => r.json())
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="card border-green-100 bg-green-50 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-12 w-full" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="card border-green-100 bg-green-50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <span>✨</span> AI Summary
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{summary}</p>
    </div>
  );
}

export function ReviewInsightsPanel({ providerId }: { providerId: string }) {
  const [insights, setInsights] = useState<{ likes: string[]; complaints: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ai/review-insights?id=${providerId}`)
      .then((r) => r.json())
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 font-semibold text-gray-900">
        <span>✨</span> AI Review Insights
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
                <span>•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
