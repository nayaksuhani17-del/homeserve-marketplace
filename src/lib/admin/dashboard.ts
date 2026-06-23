import type { MockDatabase } from "@/lib/mock/types";

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

  for (const p of db.providers.filter((x) => x.approved).slice(0, 2)) {
    items.push({
      id: `seed-approved-${p.id}`,
      icon: "✅",
      message: `Provider approved: ${p.name}`,
      at: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function getProviderAdminStatus(
  approved: boolean,
  rejected: boolean | undefined,
  userBanned: boolean
): "Approved" | "Pending" | "Rejected" | "Banned" {
  if (userBanned) return "Banned";
  if (approved) return "Approved";
  if (rejected) return "Rejected";
  return "Pending";
}

export const PROVIDER_STATUS_STYLES: Record<
  ReturnType<typeof getProviderAdminStatus>,
  string
> = {
  Approved: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-700",
  Banned: "bg-gray-800 text-white",
};
