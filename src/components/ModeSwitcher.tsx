"use client";

import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import type { AppMode } from "@/lib/mock/types";
import {
  hasCustomerRole,
  hasProviderRole,
  isAdmin,
  isDualRole,
  modePresentation,
} from "@/lib/user-capabilities";

/** Prominent pill + optional mode switch for dual-role accounts. */
export function ActiveModeControl() {
  const router = useRouter();
  const { user, activeMode, switchMode, loading, ready } = useMockApp();

  if (!user || !activeMode || isAdmin(user)) return null;

  const pres = modePresentation(activeMode);
  const dual = isDualRole(user);

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
    <div
      className="flex items-center gap-1.5 sm:gap-2"
      role="group"
      aria-label={`Current mode: ${pres.label}`}
    >
      <div
        className={`flex items-center gap-1.5 rounded-full border px-2 py-1 shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 ${pres.pillClass}`}
        title={pres.description}
      >
        <span
          className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${pres.dotClass}`}
          aria-hidden
        />
        <span className="text-[10px] font-bold uppercase leading-none tracking-wide sm:text-xs">
          <span className="sm:hidden">{pres.shortLabel}</span>
          <span className="hidden sm:inline">{pres.label}</span>
        </span>
      </div>

      {dual && (
        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          {(["customer", "provider"] as const).map((mode) => {
            const enabled =
              mode === "customer" ? hasCustomerRole(user) : hasProviderRole(user);
            if (!enabled) return null;
            const active = activeMode === mode;
            const modePres = modePresentation(mode);
            return (
              <button
                key={mode}
                type="button"
                disabled={!ready || loading || active}
                onClick={() => handleSwitch(mode)}
                title={`Switch to ${modePres.label}`}
                aria-pressed={active}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition sm:px-2.5 sm:text-xs ${
                  active ? modePres.activeSwitchClass : modePres.inactiveSwitchClass
                } disabled:cursor-default`}
              >
                {modePres.shortLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Full-width context strip so mode is obvious on every page. */
export function ActiveModeStrip() {
  const { user, activeMode } = useMockApp();

  if (!user || !activeMode || isAdmin(user)) return null;

  const pres = modePresentation(activeMode);
  const dual = isDualRole(user);

  return (
    <div
      className={`border-b ${pres.stripClass}`}
      role="status"
      aria-live="polite"
      aria-label={pres.label}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
        <p className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="text-base leading-none" aria-hidden>
            {pres.icon}
          </span>
          <span className="truncate">
            <span className="uppercase tracking-wide">{pres.label}</span>
            <span className="mx-1.5 hidden font-normal opacity-60 sm:inline">
              ·
            </span>
            <span className="hidden font-normal sm:inline">{pres.stripHint}</span>
          </span>
        </p>
        {dual && (
          <span className="hidden shrink-0 text-[11px] font-medium opacity-80 sm:inline">
            Switch mode in the header →
          </span>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use ActiveModeControl */
export const ModeSwitcher = ActiveModeControl;

/** @deprecated Use ActiveModeControl */
export function ModeBadge() {
  return null;
}
