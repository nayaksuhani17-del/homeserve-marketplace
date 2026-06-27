import type { MockDatabase } from "@/lib/mock/types";
import { isProviderVerified } from "@/lib/provider-verification";

export type AdminActivityItem = {
  id: string;
  icon: string;
  message: string;
  at: string;
};

/** Recent platform events derived from DB state for admin activity feed. */
export function getAdminActivitySeed(db: MockDatabase): AdminActivityItem[] {
  const items: AdminActivityItem[] = [];

  for (const b of [...db.bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)) {
    items.push({
      id: `seed-booking-${b.id}`,
      icon: "📅",
      message: `New booking: ${b.customerName} → ${b.providerName} (${b.service})`,
      at: b.createdAt,
    });
  }

  for (const p of db.providers.filter((x) => isProviderVerified(x)).slice(0, 2)) {
    items.push({
      id: `seed-approved-${p.id}`,
      icon: "✅",
      message: `Provider verified: ${p.name}`,
      at: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function getProviderAdminStatus(
  verified: boolean,
  rejected: boolean | undefined,
  userBanned: boolean
): "Verified ✅" | "Unverified ⚠️" | "Rejected" | "Banned" {
  if (userBanned) return "Banned";
  if (rejected) return "Rejected";
  if (verified) return "Verified ✅";
  return "Unverified ⚠️";
}

export const PROVIDER_STATUS_STYLES: Record<
  ReturnType<typeof getProviderAdminStatus>,
  string
> = {
  "Verified ✅": "bg-blue-100 text-blue-800",
  "Unverified ⚠️": "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-700",
  Banned: "bg-gray-800 text-white",
};
