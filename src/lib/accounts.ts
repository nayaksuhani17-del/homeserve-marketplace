import type { MockUser } from "@/lib/mock/types";
import { capabilitySummary as userCapabilitySummary } from "@/lib/user-capabilities";

const DEMO_EMAILS = new Set([
  "sarah.mitchell@demo.com",
  "marcus.reed@demo.com",
  "admin@test.com",
]);

export function isDemoAccount(user: Pick<MockUser, "email">): boolean {
  return DEMO_EMAILS.has(user.email.toLowerCase()) || user.email.endsWith("@demo.com");
}

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  role: MockUser["role"];
  capabilities: string;
  isDemo: boolean;
  isActive: boolean;
};

export function capabilitySummary(user: MockUser): string {
  return userCapabilitySummary(user);
}

export function roleLabel(role: MockUser["role"]): string {
  if (role === "admin") return "Admin";
  if (role === "provider") return "Provider";
  return "Customer";
}

export function roleBadgeClass(role: MockUser["role"]): string {
  if (role === "admin") return "bg-violet-100 text-violet-800";
  if (role === "provider") return "bg-amber-100 text-amber-900";
  return "bg-sky-100 text-sky-900";
}

export function dashboardPathForRole(role: MockUser["role"]): string {
  if (role === "admin") return "/admin";
  if (role === "provider") return "/provider/dashboard";
  return "/customer/dashboard";
}
