/** Executive demo optimizations — tuned for live presentations. */
export const DEMO_MODE = true;

/** Max providers shown per marketplace page during demo. */
export const DEMO_PROVIDER_PAGE_SIZE = 10;

/** Default landing path after one-click customer demo login. */
export const DEMO_CUSTOMER_LANDING = "/customer/dashboard?service=Plumber";

export const DEMO_ROLE_REDIRECT: Record<"customer" | "provider" | "admin", string> = {
  customer: DEMO_CUSTOMER_LANDING,
  provider: "/provider/dashboard",
  admin: "/admin",
};
