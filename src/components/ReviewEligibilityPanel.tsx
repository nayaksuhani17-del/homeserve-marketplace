"use client";

import { useState } from "react";
import { ReviewForm } from "./ReviewForm";
import { useMockApp } from "@/context/MockAppContext";
import {
  canReviewBooking,
  hasReviewForBooking,
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
  REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE,
} from "@/lib/mock/operations";
import type { MockBooking } from "@/lib/mock/types";

type ReviewEligibilityPanelProps = {
  booking: MockBooking;
  providerId: string;
  className?: string;
};

export function ReviewEligibilityPanel({
  booking,
  providerId,
  className = "",
}: ReviewEligibilityPanelProps) {
  const { user, db } = useMockApp();
  const [formOpen, setFormOpen] = useState(false);

  if (!user || !db) return null;
  if (booking.customerId !== user.id || booking.providerId !== providerId) return null;

  const canReview = canReviewBooking(db, booking, user.id);

  if (canReview) {
    return (
      <div className={className}>
        {!formOpen ? (
          <button type="button" onClick={() => setFormOpen(true)} className="btn-primary">
            Leave Review
          </button>
        ) : (
          <ReviewForm providerId={providerId} bookingId={booking.id} />
        )}
      </div>
    );
  }

  if (booking.status === "completed" && hasReviewForBooking(db, booking.id)) {
    return (
      <p className={`text-sm text-gray-600 ${className}`.trim()}>
        {REVIEW_ALREADY_SUBMITTED_MESSAGE}
      </p>
    );
  }

  if (booking.status === "pending" || booking.status === "confirmed") {
    return (
      <p className={`text-sm text-gray-500 ${className}`.trim()}>
        {REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE}
      </p>
    );
  }

  return null;
}
