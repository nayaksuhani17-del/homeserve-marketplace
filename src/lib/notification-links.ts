import type { MockUser } from "@/lib/mock/types";
import {
  defaultModeForUser,
  hasCustomerRole,
  hasProviderRole,
} from "@/lib/user-capabilities";

export function customerBookingsHref(tab: "upcoming" | "past" = "upcoming") {
  return `/customer/dashboard?bookings=${tab}#your-bookings`;
}

export function providerDashboardHref(tab?: "requests" | "upcoming" | "completed") {
  return tab ? `/provider/dashboard?tab=${tab}#bookings` : "/provider/dashboard#bookings";
}

export function chatHrefForDashboard(
  dashboard: "customer" | "provider",
  otherUserId: string
) {
  const base =
    dashboard === "customer" ? "/customer/dashboard" : "/provider/dashboard";
  return `${base}?chat=${encodeURIComponent(otherUserId)}`;
}

/** Deep link to open a DM thread with another user. */
export function chatHrefForUser(viewer: MockUser, otherUserId: string): string {
  const mode =
    hasProviderRole(viewer) && !hasCustomerRole(viewer)
      ? "provider"
      : hasCustomerRole(viewer) && !hasProviderRole(viewer)
        ? "customer"
        : defaultModeForUser(viewer);
  return chatHrefForDashboard(mode, otherUserId);
}

export function messageNotificationHref(receiver: MockUser, senderId: string): string {
  return chatHrefForUser(receiver, senderId);
}

/** Normalize legacy notification links and infer tab from message text. */
export function resolveNotificationHref(href: string, message: string): string {
  if (href.includes("chat=")) return href;
  if (href.includes("bookings=") || href.includes("#your-bookings")) return href;
  if (!href.startsWith("/customer/dashboard")) return href;

  const past =
    message.includes("declined") ||
    message.includes("cancelled") ||
    message.includes("complete");
  return customerBookingsHref(past ? "past" : "upcoming");
}

export function scrollToNotificationTarget(href: string) {
  const hash = href.includes("#") ? href.split("#")[1] : "your-bookings";
  document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
