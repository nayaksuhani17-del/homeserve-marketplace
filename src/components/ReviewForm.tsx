"use client";

import { useMemo, useState, useTransition } from "react";
import { StarRating } from "./StarRating";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";
import {
  validateReview,
  findReviewForBooking,
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
} from "@/lib/mock/operations";

type ReviewFormProps = {
  providerId: string;
  bookingId: string;
  onSuccess?: () => void;
};

export function ReviewForm({ providerId, bookingId, onSuccess }: ReviewFormProps) {
  const { addReview, user, db } = useMockApp();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eligibilityError = useMemo(() => {
    if (!user) return "You must be logged in.";
    if (!db) return "Loading…";
    if (findReviewForBooking(db, bookingId)) return REVIEW_ALREADY_SUBMITTED_MESSAGE;
    return validateReview(db, {
      customerId: user.id,
      bookingId,
      providerId,
      rating,
    });
  }, [user, db, bookingId, providerId, rating]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    if (eligibilityError) {
      setError(eligibilityError);
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
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }
      toast("Review submitted — provider rating updated", "success");
      setComment("");
      onSuccess?.();
    });
  }

  if (eligibilityError) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        {eligibilityError}
      </p>
    );
  }

  const display = hover || rating;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-green-100 bg-green-50/50 p-5">
      <h3 className="font-semibold text-gray-900">Leave a review</h3>
      <p className="mt-1 text-sm text-gray-500">Your rating updates the provider instantly.</p>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="rounded-lg p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
              aria-label={`${n} stars`}
            >
              <span
                className={`text-2xl ${n <= display ? "text-amber-400" : "text-gray-300"}`}
              >
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">{display} / 5</span>
        </div>
        <StarRating rating={display} size="sm" showNumeric={false} />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
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
