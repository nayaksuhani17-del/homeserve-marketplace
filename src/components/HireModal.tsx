"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";

type HireModalProps = {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  hourlyRate: number;
  defaultService: string;
};

export function HireModal({
  open,
  onClose,
  providerId,
  providerName,
  hourlyRate,
  defaultService,
}: HireModalProps) {
  const { createBooking, user } = useMockApp();
  const [service, setService] = useState(defaultService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [hours, setHours] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    service: string;
    date: string;
    time: string | null;
    providerName: string;
    estimatedCost: number;
    hours: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const estimatedCost = hourlyRate * hours;
  const minDate = new Date().toISOString().split("T")[0];

  function handleClose() {
    setConfirmed(null);
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in to book.");
      return;
    }
    if (!service.trim() || !date.trim()) {
      setError("Please fill all fields.");
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        providerId,
        service,
        date,
        time,
        hours,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.booking) {
        setConfirmed({
          service: result.booking.service,
          date: result.booking.date,
          time: result.booking.time ?? null,
          providerName: result.booking.providerName,
          estimatedCost: result.booking.estimatedCost,
          hours: result.booking.hours,
        });
        toast("Booking confirmed!", "success");
        toast("New job request sent to provider", "info");
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title={confirmed ? "Booking Confirmed ✅" : `Hire ${providerName}`}>
      {confirmed ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            You&apos;re all set!
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {confirmed.providerName} will confirm your {confirmed.service} booking.
          </p>
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <p><span className="text-gray-500">Date:</span> {confirmed.date}</p>
            <p className="mt-1"><span className="text-gray-500">Time:</span> {confirmed.time ?? "TBD"}</p>
            <p className="mt-1"><span className="text-gray-500">Duration:</span> {confirmed.hours} hours</p>
            <p className="mt-2 border-t border-gray-200 pt-2 font-semibold text-green-700">
              Estimated cost: ${confirmed.estimatedCost.toFixed(0)}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="btn-primary mt-6 w-full">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estimated hours: {hours}h
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
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-sm text-gray-600">Estimated cost</p>
            <p className="text-2xl font-bold text-green-700">
              ${estimatedCost.toFixed(0)}
              <span className="text-sm font-normal text-gray-500">
                {" "}(${hourlyRate}/hr × {hours}h)
              </span>
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary flex-1 disabled:opacity-60">
              {pending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
