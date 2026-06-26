import type { AppMode, MockSession, MockUser } from "@/lib/mock/types";

export type { AppMode };

export function isAdmin(user: MockUser): boolean {
  return user.role === "admin";
}

export function hasCustomerRole(user: MockUser): boolean {
  if (isAdmin(user)) return false;
  return user.customerRole;
}

export function hasProviderRole(user: MockUser): boolean {
  if (isAdmin(user)) return false;
  return user.providerRole;
}

export function isDualRole(user: MockUser): boolean {
  return hasCustomerRole(user) && hasProviderRole(user);
}

export function defaultModeForUser(user: MockUser): AppMode {
  if (hasProviderRole(user) && !hasCustomerRole(user)) return "provider";
  return "customer";
}

export function resolveActiveMode(
  user: MockUser | null,
  session: MockSession | null
): AppMode | null {
  if (!user || isAdmin(user)) return null;
  const stored = session?.activeMode;
  if (stored === "customer" && hasCustomerRole(user)) return "customer";
  if (stored === "provider" && hasProviderRole(user)) return "provider";
  return defaultModeForUser(user);
}

export function sessionForUser(
  user: MockUser,
  previous?: MockSession | null
): MockSession {
  let activeMode = defaultModeForUser(user);
  if (previous?.userId === user.id && previous.activeMode) {
    if (previous.activeMode === "provider" && hasProviderRole(user)) {
      activeMode = "provider";
    } else if (previous.activeMode === "customer" && hasCustomerRole(user)) {
      activeMode = "customer";
    }
  }
  return { userId: user.id, activeMode };
}

export function dashboardPathForMode(mode: AppMode): string {
  return mode === "provider" ? "/provider/dashboard" : "/customer/dashboard";
}

export function modeLabel(mode: AppMode): string {
  return mode === "provider" ? "Provider" : "Customer";
}

export type ModePresentation = {
  label: string;
  shortLabel: string;
  description: string;
  stripHint: string;
  icon: string;
  stripClass: string;
  pillClass: string;
  activeSwitchClass: string;
  inactiveSwitchClass: string;
  dotClass: string;
};

export function modePresentation(mode: AppMode): ModePresentation {
  if (mode === "provider") {
    return {
      label: "Provider Mode",
      shortLabel: "Provider",
      description: "Managing jobs & earnings",
      stripHint: "You are acting as a provider — job requests, active jobs, and earnings",
      icon: "🛠️",
      stripClass: "border-amber-200 bg-amber-50 text-amber-950",
      pillClass: "border-amber-400 bg-amber-100 text-amber-950 ring-2 ring-amber-200/80",
      activeSwitchClass: "bg-amber-600 text-white shadow-sm",
      inactiveSwitchClass: "text-amber-900/70 hover:bg-amber-100",
      dotClass: "bg-amber-500",
    };
  }
  return {
    label: "Customer Mode",
    shortLabel: "Customer",
    description: "Browsing & booking services",
    stripHint: "You are acting as a customer — search, book, and review services",
    icon: "🛒",
    stripClass: "border-sky-200 bg-sky-50 text-sky-950",
    pillClass: "border-sky-400 bg-sky-100 text-sky-950 ring-2 ring-sky-200/80",
    activeSwitchClass: "bg-sky-600 text-white shadow-sm",
    inactiveSwitchClass: "text-sky-900/70 hover:bg-sky-100",
    dotClass: "bg-sky-500",
  };
}

export function capabilitySummary(user: MockUser): string {
  if (isAdmin(user)) return "Admin";
  if (isDualRole(user)) return "Customer & Provider";
  if (hasProviderRole(user)) return "Provider";
  return "Customer";
}
