/** Executive demo optimizations — tuned for live presentations. */
export const DEMO_MODE = true;

/** MockAppContext + localStorage is the active runtime. Supabase routes and server actions are kept for a future production cutover. */

/**
 * When true, bookings stay pending until the provider accepts or rejects manually.
 * Shared localStorage is the single source of truth across account switches.
 */
export const MANUAL_BOOKING_FLOW = true;

/** Generated catalog size in demo (full prod-style build uses 350). */
export const DEMO_CATALOG_SIZE = 60;

/** Max providers shown per marketplace page during demo. */
export const DEMO_PROVIDER_PAGE_SIZE = 10;

/** Default landing path after one-click customer demo login. */
export const DEMO_CUSTOMER_LANDING = "/customer/dashboard?service=Plumber";

export const DEMO_ROLE_REDIRECT: Record<"customer" | "provider" | "admin", string> = {
  customer: DEMO_CUSTOMER_LANDING,
  provider: "/provider/dashboard",
  admin: "/admin",
};
