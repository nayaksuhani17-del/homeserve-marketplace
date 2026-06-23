import type { MockBooking } from "@/lib/mock/types";
import { bookingStatusLabel, paymentStatusLabel } from "@/lib/mock/simulation";

const STATUS_STYLES: Record<MockBooking["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const PAYMENT_STYLES: Record<MockBooking["paymentStatus"], string> = {
  none: "text-gray-500",
  authorized: "text-indigo-600",
  released: "text-green-600",
  refunded: "text-orange-600",
};

type BookingStatusBadgeProps = {
  status: MockBooking["status"];
  paymentStatus?: MockBooking["paymentStatus"];
  showPayment?: boolean;
};

export function BookingStatusBadge({
  status,
  paymentStatus = "none",
  showPayment = false,
}: BookingStatusBadgeProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`tag-pill ${STATUS_STYLES[status]}`}>
        {bookingStatusLabel(status)}
      </span>
      {showPayment && paymentStatus !== "none" && (
        <span className={`text-xs font-medium ${PAYMENT_STYLES[paymentStatus]}`}>
          {paymentStatusLabel(paymentStatus)}
        </span>
      )}
    </span>
  );
}
