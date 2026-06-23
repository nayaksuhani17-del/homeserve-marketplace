"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { useMockApp } from "@/context/MockAppContext";

const REPORT_REASONS = [
  "Unprofessional behavior",
  "No-show / late arrival",
  "Pricing dispute",
  "Safety concern",
  "Scam or fraud",
  "Other",
];

type ReportProviderModalProps = {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  bookingId?: string;
};

export function ReportProviderModal({
  open,
  onClose,
  providerName,
  providerId,
  bookingId,
}: ReportProviderModalProps) {
  const { reportProvider } = useMockApp();
  const { toast } = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]!);
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await reportProvider({
        providerId,
        bookingId,
        reason,
        details,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Report submitted — our team will review it", "success");
      setDetails("");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Report ${providerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Reports help keep HomeServe safe. Our admin team reviews every submission.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-field"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Describe what happened…"
            className="input-field"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary flex-1 disabled:opacity-60">
            {pending ? "Submitting…" : "Submit report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
