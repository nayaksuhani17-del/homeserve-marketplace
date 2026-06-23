"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";
import { estimateBookingCost, formatProviderPrice } from "@/lib/pricing";
import { getPriceBreakdown, suggestBestTimeToday } from "@/lib/smart";
import { bookingStatusLabel, paymentStatusLabel } from "@/lib/mock/simulation";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { MockBooking } from "@/lib/mock/types";
import type { PricingType } from "@/lib/pricing";

type HireModalProps = {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  pricingType: PricingType;
  price: number;
  basePrice?: number;
  hourlyRate?: number;
  availableToday?: boolean;
  defaultService: string;
  rebookPrefill?: Partial<Pick<MockBooking, "service" | "date" | "time" | "hours">>;
  quickBook?: boolean;
};

type Step = "form" | "slots" | "processing" | "waiting" | "done";

export function HireModal(props: HireModalProps) {
  if (!props.open) return null;
  const sessionKey = [
    props.providerId,
    props.defaultService,
    props.rebookPrefill?.service ?? "",
    props.rebookPrefill?.date ?? "",
    props.rebookPrefill?.time ?? "",
    props.quickBook ? "1" : "0",
  ].join("|");
  return <HireModalSession key={sessionKey} {...props} open />;
}

function HireModalSession({
  open,
  onClose,
  providerId,
  providerName,
  pricingType,
  price,
  basePrice = 0,
  hourlyRate,
  defaultService,
  availableToday = false,
  rebookPrefill,
  quickBook = false,
}: HireModalProps) {
  const { createBooking, getAvailableSlots, getAvailabilityHint, db } = useMockApp();
  const initialStep: Step =
    quickBook && rebookPrefill?.date && rebookPrefill?.time ? "slots" : "form";
  const [service, setService] = useState(rebookPrefill?.service ?? defaultService);
  const [date, setDate] = useState(rebookPrefill?.date ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(rebookPrefill?.time ?? null);
  const [hours, setHours] = useState(rebookPrefill?.hours ?? 2);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(initialStep);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [resultBooking, setResultBooking] = useState<MockBooking | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const notifiedBookingRef = useRef<string | null>(null);

  const rate = hourlyRate ?? price;
  const estimatedCost = estimateBookingCost(pricingType, price, hours);
  const breakdown = getPriceBreakdown(
    pricingType,
    price,
    basePrice,
    rate,
    hours
  );
  const bestTime = suggestBestTimeToday(availableToday);
  const minDate = new Date().toISOString().split("T")[0];
  const slots = date ? getAvailableSlots(providerId, date) : [];
  const availabilityHint = getAvailabilityHint(providerId);

  const liveBooking =
    bookingId && db ? db.bookings.find((b) => b.id === bookingId) : undefined;
  const resolvedWhileWaiting =
    step === "waiting" && liveBooking && liveBooking.status !== "pending"
      ? liveBooking
      : null;
  const doneBooking = step === "done" ? resultBooking : resolvedWhileWaiting;
  const showWaiting = step === "waiting" && !resolvedWhileWaiting;
  const showDone = Boolean(doneBooking);

  useEffect(() => {
    if (!resolvedWhileWaiting) return;
    if (notifiedBookingRef.current === resolvedWhileWaiting.id) return;
    notifiedBookingRef.current = resolvedWhileWaiting.id;
    if (resolvedWhileWaiting.status === "confirmed") {
      toast("Booking confirmed!", "success");
    } else if (resolvedWhileWaiting.status === "declined") {
      toast("Provider declined request", "error");
    }
  }, [resolvedWhileWaiting, toast]);

  function resetState() {
    setSelectedSlot(null);
    setError(null);
    setStep("form");
    setBookingId(null);
    setResultBooking(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function goToSlots(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!service.trim() || !date.trim()) {
      setError("Please fill all fields.");
      return;
    }
    const available = getAvailableSlots(providerId, date);
    if (available.length === 0) {
      setError("No time slots left for this date. Try another day.");
      return;
    }
    setSelectedSlot(available[0] ?? null);
    setStep("slots");
  }

  function handleConfirmSlot() {
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    setError(null);
    setStep("processing");

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      const result = await createBooking({
        providerId,
        service,
        date,
        time: selectedSlot,
        hours,
      });
      if (result.error) {
        setError(result.error);
        setStep("slots");
        return;
      }
      if (result.booking) {
        setBookingId(result.booking.id);
        setResultBooking(result.booking);
        setStep("waiting");
        toast("Request sent — waiting for provider", "info");
      }
    });
  }

  const title = showDone
    ? doneBooking?.status === "confirmed"
      ? "Booking Confirmed"
      : doneBooking?.status === "declined"
        ? "Booking Declined"
        : "Request Submitted"
    : showWaiting
      ? "Waiting for provider"
      : step === "processing"
        ? "Creating booking…"
        : step === "slots"
          ? "Pick a time"
          : `Hire ${providerName}`;

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {step === "processing" ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          <p className="mt-4 font-medium text-gray-900">Submitting your request</p>
          <p className="mt-1 text-sm text-gray-500">Securing your time slot…</p>
        </div>
      ) : showWaiting ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
          <p className="mt-4 font-medium text-gray-900">Provider is responding…</p>
          <p className="mt-1 text-sm text-gray-500">
            {providerName} typically replies based on their response time profile.
          </p>
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <p>
              <span className="text-gray-500">Service:</span> {service}
            </p>
            <p className="mt-1">
              <span className="text-gray-500">When:</span> {date} at {selectedSlot}
            </p>
            <p className="mt-2">
              <BookingStatusBadge status="pending" />
            </p>
          </div>
        </div>
      ) : showDone && doneBooking ? (
        <div className="animate-fade-in text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
              doneBooking.status === "confirmed"
                ? "bg-green-100 text-green-600"
                : doneBooking.status === "declined"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-600"
            }`}
          >
            {doneBooking.status === "confirmed"
              ? "✓"
              : doneBooking.status === "declined"
                ? "✕"
                : "…"}
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            {bookingStatusLabel(doneBooking.status)}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {doneBooking.status === "confirmed"
              ? `${providerName} accepted your ${service} booking.`
              : doneBooking.status === "declined"
                ? `${providerName} couldn't take this slot. Try another time or pro.`
                : `Your request was sent to ${providerName}.`}
          </p>
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <p>
              <span className="text-gray-500">Date:</span> {doneBooking.date}
            </p>
            <p className="mt-1">
              <span className="text-gray-500">Time:</span>{" "}
              {doneBooking.time ?? "TBD"}
            </p>
            <p className="mt-1">
              <span className="text-gray-500">Duration:</span> ~{doneBooking.hours}h
            </p>
            <p className="mt-2 border-t border-gray-200 pt-2 font-semibold text-green-700">
              Estimated cost: ${doneBooking.estimatedCost.toFixed(0)}
            </p>
            <div className="mt-3">
              <BookingStatusBadge
                status={doneBooking.status}
                paymentStatus={doneBooking.paymentStatus}
                showPayment
              />
            </div>
            {doneBooking.paymentStatus !== "none" && (
              <p className="mt-2 text-xs text-gray-500">
                {paymentStatusLabel(doneBooking.paymentStatus)}
              </p>
            )}
          </div>
          <button type="button" onClick={handleClose} className="btn-primary mt-6 w-full">
            Done
          </button>
        </div>
      ) : step === "slots" ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Available slots for <strong>{date}</strong>
          </p>
          {slots.length === 0 ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              No time slots left for this date. Go back and pick another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    selectedSlot === slot
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              type="button"
              disabled={pending || !selectedSlot || slots.length === 0}
              onClick={handleConfirmSlot}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {pending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={goToSlots} className="space-y-4">
          <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
            ⚡ {bestTime}
          </div>
          <p className="text-xs text-gray-500">{availabilityHint}</p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estimated duration: {hours}h
            </label>
            <input
              type="range"
              min={1}
              max={8}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Price breakdown</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {breakdown.map((line) => (
                <li key={line.label} className="flex justify-between">
                  <span>{line.label}</span>
                  <span>${line.amount}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-gray-200 pt-2 text-2xl font-bold text-green-700">
              ${estimatedCost.toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {formatProviderPrice(pricingType, price)}
              {pricingType === "hourly" && ` · ${hours}h estimated`}
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Choose time slot
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
