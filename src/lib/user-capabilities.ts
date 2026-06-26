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

export function capabilitySummary(user: MockUser): string {
  if (isAdmin(user)) return "Admin";
  if (isDualRole(user)) return "Customer & Provider";
  if (hasProviderRole(user)) return "Provider";
  return "Customer";
}
