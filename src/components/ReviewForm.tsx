import { createReviewAction } from "@/lib/actions";

type ReviewFormProps = {
  providerId: string;
  bookingId?: string;
};

export function ReviewForm({ providerId, bookingId }: ReviewFormProps) {
  return (
    <form action={createReviewAction} className="card bg-white p-5">
      <h3 className="font-semibold text-gray-900">Leave a review</h3>
      <input type="hidden" name="provider_id" value={providerId} />
      {bookingId && <input type="hidden" name="booking_id" value={bookingId} />}

      <div className="mt-3">
        <label className="mb-1 block text-sm text-gray-700">Rating (1-5)</label>
        <select name="rating" required className="input-field">
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
          name="comment"
          rows={3}
          placeholder="Share your experience..."
          className="input-field"
        />
      </div>

      <button type="submit" className="btn-primary mt-4">
        Submit review
      </button>
    </form>
  );
}
