"use client";

import { useState, useTransition } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import type { MockProvider } from "@/lib/mock/types";

type ProviderStatusControlsProps = {
  provider: MockProvider;
};

export function ProviderStatusControls({ provider }: ProviderStatusControlsProps) {
  const { updateProvider } = useMockApp();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [availableToday, setAvailableToday] = useState(provider.availableToday);
  const [availableTomorrow, setAvailableTomorrow] = useState(provider.availableTomorrow);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(
    provider.autoReplyEnabled ?? false
  );

  function save(patch: {
    availableToday?: boolean;
    availableTomorrow?: boolean;
    autoReplyEnabled?: boolean;
  }) {
    startTransition(async () => {
      const result = await updateProvider(patch);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Status updated", "success");
    });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900">Work status</h2>
      <p className="mt-1 text-sm text-gray-500">
        Control when customers see you as available and how messages are handled.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={availableToday}
            disabled={pending}
            onChange={(e) => {
              setAvailableToday(e.target.checked);
              save({ availableToday: e.target.checked });
            }}
            className="accent-green-600"
          />
          Available today
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={availableTomorrow}
            disabled={pending}
            onChange={(e) => {
              setAvailableTomorrow(e.target.checked);
              save({ availableTomorrow: e.target.checked });
            }}
            className="accent-green-600"
          />
          Available tomorrow
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={autoReplyEnabled}
            disabled={pending}
            onChange={(e) => {
              setAutoReplyEnabled(e.target.checked);
              save({ autoReplyEnabled: e.target.checked });
            }}
            className="mt-0.5 accent-green-600"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">
              Auto-reply when unavailable
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Sends short templated replies in booking chat and direct messages until you
              respond yourself.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
