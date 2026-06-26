import type { MockProvider } from "@/lib/mock/types";

/** Profile URL for a user — provider profiles use `/provider/[id]`, customers use `/user/[id]`. */
export function profileHrefForUser(
  userId: string,
  getProviderForUser: (id: string) => MockProvider | undefined,
  options?: { returnTo?: string }
): string {
  const provider = getProviderForUser(userId);
  const params = new URLSearchParams();
  if (options?.returnTo) params.set("from", options.returnTo);
  const qs = params.toString() ? `?${params.toString()}` : "";

  if (provider) {
    return `/provider/${provider.id}${qs}`;
  }
  return `/user/${userId}${qs}`;
}

export function resolveProfileBackLink(from: string | null): {
  href: string;
  label: string;
} {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return {
      href: from,
      label: from.includes("/messages") ? "← Back to Messages" : "← Back",
    };
  }
  return { href: "/customer/dashboard", label: "← Back to providers" };
}

export function splitDisplayName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "User", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}
