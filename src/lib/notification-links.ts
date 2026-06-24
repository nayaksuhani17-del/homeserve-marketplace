export function customerBookingsHref(tab: "upcoming" | "past" = "upcoming") {
  return `/customer/dashboard?bookings=${tab}#your-bookings`;
}

export function providerDashboardHref(tab?: "requests" | "upcoming" | "completed") {
  return tab ? `/provider/dashboard?tab=${tab}#bookings` : "/provider/dashboard#bookings";
}

/** Normalize legacy notification links and infer tab from message text. */
export function resolveNotificationHref(href: string, message: string): string {
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
