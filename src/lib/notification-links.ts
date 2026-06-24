export function customerBookingsHref(tab: "upcoming" | "past" = "upcoming") {
  return `/customer/dashboard?bookings=${tab}#your-bookings`;
}

export function providerDashboardHref(tab?: "requests" | "upcoming" | "completed") {
  return tab ? `/provider/dashboard?tab=${tab}#bookings` : "/provider/dashboard#bookings";
}
