"use client";

import { useState, useTransition } from "react";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";

type ReviewFormProps = {
  providerId: string;
  bookingId?: string;
};

export function ReviewForm({ providerId, bookingId }: ReviewFormProps) {
  const { addReview, user } = useMockApp();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    startTransition(async () => {
      const result = await addReview({
        providerId,
        bookingId,
        rating,
        comment,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast("Review submitted — rating updated!", "success");
      setComment("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-white p-5">
      <h3 className="font-semibold text-gray-900">Leave a review</h3>

      <div className="mt-3">
        <label className="mb-1 block text-sm text-gray-700">Rating (1-5)</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          required
          className="input-field"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"⭐".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-sm text-gray-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience..."
          className="input-field"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary mt-4 disabled:opacity-60">
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
