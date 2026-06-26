"use client";

import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import type { AppMode } from "@/lib/mock/types";
import { hasCustomerRole, hasProviderRole, isDualRole, modeLabel } from "@/lib/user-capabilities";

export function ModeSwitcher() {
  const router = useRouter();
  const { user, activeMode, switchMode, loading, ready } = useMockApp();

  if (!user || !activeMode || !isDualRole(user)) return null;

  async function handleSwitch(mode: AppMode) {
    if (!ready || loading || mode === activeMode) return;
    const result = await switchMode(mode);
    if (result.error) return;
    if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        Switch mode
      </span>
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {(["customer", "provider"] as const).map((mode) => {
        const enabled = mode === "customer" ? hasCustomerRole(user) : hasProviderRole(user);
        if (!enabled) return null;
        const active = activeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            disabled={!ready || loading || active}
            onClick={() => handleSwitch(mode)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-white text-green-800 shadow-sm"
                : "text-gray-600 hover:text-green-700"
            } disabled:opacity-60`}
          >
            {modeLabel(mode)}
          </button>
        );
      })}
      </div>
    </div>
  );
}

export function ModeBadge() {
  const { user, activeMode } = useMockApp();
  if (!user || !activeMode) return null;

  return (
    <span className="hidden rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 md:inline">
      Current mode: {modeLabel(activeMode)}
    </span>
  );
}
