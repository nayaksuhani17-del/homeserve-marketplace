"use client";

import { useState } from "react";
import { SERVICE_CATEGORIES } from "@/lib/constants";

/** @deprecated Use SmartAssistant instead */
export function ServiceChatbot() {
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get suggestion");
      setSuggestion(data.category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card border-green-100 bg-gradient-to-br from-green-50 to-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Need help choosing a service?
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Tell us what you need and our AI will suggest the best category.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. My kitchen sink is leaking..."
          className="input-field flex-1"
        />
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? "Thinking..." : "Suggest"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {suggestion && (
        <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-green-100">
          <p className="text-sm text-gray-600">We recommend:</p>
          <p className="mt-1 text-lg font-semibold text-green-700">{suggestion}</p>
          <a
            href={`/customer/dashboard?service=${encodeURIComponent(suggestion)}`}
            className="link-brand mt-3 inline-block text-sm"
          >
            Browse {suggestion} providers →
          </a>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Categories: {SERVICE_CATEGORIES.slice(0, 5).join(", ")}, and more.
      </p>
    </div>
  );
}
