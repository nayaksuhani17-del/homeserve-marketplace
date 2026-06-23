"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "./Modal";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  calculateInstantQuote,
  formatQuoteRange,
  JOB_SIZE_OPTIONS,
  URGENCY_OPTIONS,
  type JobSize,
  type QuoteInput,
  type QuoteResult,
  type QuoteProviderProfile,
  type ServicePackage,
  type Urgency,
} from "@/lib/quotes";

type QuoteModalProps = {
  open: boolean;
  onClose: () => void;
  providerName: string;
  profile: QuoteProviderProfile;
  defaultService?: string;
};

export function QuoteModal({
  open,
  onClose,
  providerName,
  profile,
  defaultService,
}: QuoteModalProps) {
  const [service, setService] = useState(defaultService || profile.services[0] || SERVICE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [jobSize, setJobSize] = useState<JobSize>("medium");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setService(defaultService || profile.services[0] || SERVICE_CATEGORIES[0]);
    setDescription("");
    setJobSize("medium");
    setUrgency("normal");
    setResult(null);
    setAnalyzing(false);
  }, [open, defaultService, profile.services]);

  function handleClose() {
    setResult(null);
    onClose();
  }

  function runQuote(selectedPackage?: ServicePackage) {
    setAnalyzing(true);
    setResult(null);

    const input: QuoteInput = {
      service,
      description: selectedPackage
        ? `${selectedPackage.label}. ${description}`.trim()
        : description || "General service request",
      jobSize,
      urgency,
    };

    startTransition(() => {
      setTimeout(() => {
        let quote = calculateInstantQuote(profile, input, providerName);
        if (selectedPackage) {
          const urgent = urgency === "urgent" ? 1.22 : 1;
          const base = selectedPackage.price * urgent;
          quote = {
            ...quote,
            matchedPackage: selectedPackage,
            analysisNote: `You selected "${selectedPackage.label}" — here's your instant estimate.`,
            priceMin: Math.round(base * 0.92),
            priceMax: Math.round(base * 1.12),
          };
        }
        setResult(quote);
        setAnalyzing(false);
      }, 480 + Math.random() * 320);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQuote();
  }

  const packages = profile.servicePackages ?? [];

  return (
    <Modal open={open} onClose={handleClose} title={`Instant Quote — ${providerName}`}>
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {packages.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Popular packages</p>
              <div className="flex flex-wrap gap-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.label}
                    type="button"
                    disabled={pending || analyzing}
                    onClick={() => runQuote(pkg)}
                    className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-left text-sm transition hover:border-green-400 hover:bg-green-100 disabled:opacity-60"
                  >
                    <span className="font-medium text-gray-900">{pkg.label}</span>
                    <span className="ml-2 text-green-700">${pkg.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input-field"
            >
              {profile.services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Describe the job
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder='e.g. "Leaking sink under the kitchen cabinet, needs repair soon"'
              className="input-field resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: mention keywords like leak, paint, or clean for smarter detection
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Job size</label>
            <div className="grid grid-cols-3 gap-2">
              {JOB_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJobSize(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    jobSize === opt.value
                      ? "border-green-600 bg-green-50 font-medium text-green-800"
                      : "border-gray-200 hover:border-green-200"
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Urgency</label>
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    urgency === opt.value
                      ? "border-green-600 bg-green-50 font-medium text-green-800"
                      : "border-gray-200 hover:border-green-200"
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || analyzing}
            className="btn-primary w-full disabled:opacity-60"
          >
            {analyzing ? "Analyzing your job…" : "Get Instant Quote"}
          </button>
        </form>
      ) : (
        <div className="animate-fade-in">
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 ring-1 ring-green-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <span aria-hidden>✨</span> Smart estimate ready
            </div>
            <p className="mt-1 text-sm text-gray-500">Estimated cost</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatQuoteRange(result.priceMin, result.priceMax)}
            </p>
            <p className="mt-3 text-sm text-gray-600">{result.analysisNote}</p>
            {result.detectedService && result.detectedService !== service && (
              <p className="mt-2 text-xs font-medium text-green-700">
                Detected category: {result.detectedService}
              </p>
            )}
            {result.matchedPackage && (
              <p className="mt-2 inline-block rounded-lg bg-white/80 px-2 py-1 text-xs text-gray-700">
                Package: {result.matchedPackage.label}
              </p>
            )}
          </div>

          {result.suggestedPackages.length > 0 && !result.matchedPackage && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">You might also consider</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.suggestedPackages.map((pkg) => (
                  <button
                    key={pkg.label}
                    type="button"
                    onClick={() => runQuote(pkg)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:border-green-300"
                  >
                    {pkg.label} · ${pkg.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-amber-700">{result.disclaimer}</p>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setResult(null)} className="btn-secondary flex-1">
              Adjust details
            </button>
            <button type="button" onClick={handleClose} className="btn-primary flex-1">
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
