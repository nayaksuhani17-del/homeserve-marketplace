import { estimateBookingCost } from "@/lib/pricing";
import { demoId } from "@/lib/demo/ids";
import { providerId, userId } from "@/lib/demo/seed-data";
import type { MockBooking, MockNotification, MockProvider, MockUser } from "./types";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

/** Rich workspace data for Sarah Mitchell demo customer dashboard. */
export function buildSarahWorkspaceBookings(
  providers: MockProvider[],
  users: MockUser[]
): MockBooking[] {
  const sarahId = userId("customer-sarah");
  const sarahName = users.find((u) => u.id === sarahId)?.name ?? "Sarah Mitchell";
  const now = Date.now();

  const bookingFor = (providerKey: string) => {
    const p = providers.find((x) => x.id === providerId(providerKey));
    if (!p) return null;
    const rate = p.hourlyRate || p.price;
    const cost = (hours: number) =>
      estimateBookingCost(p.pricingType, rate, hours);
    return { p, cost };
  };

  const marcus = bookingFor("provider-marcus");
  const nina = bookingFor("provider-nina");
  const david = bookingFor("provider-david");

  const rows: MockBooking[] = [];

  if (nina) {
    rows.push({
      id: demoId("booking:sarah-upcoming-clean"),
      customerId: sarahId,
      customerName: sarahName,
      providerId: nina.p.id,
      providerName: nina.p.name,
      service: "House Cleaning",
      date: dateOffset(2),
      time: "10:00",
      hours: 3,
      estimatedCost: nina.cost(3),
      status: "confirmed",
      paymentStatus: "authorized",
      respondedAt: new Date(now - 86400000).toISOString(),
      createdAt: new Date(now - 86400000 * 2).toISOString(),
    });
  }

  if (marcus) {
    rows.push({
      id: demoId("booking:sarah-upcoming-plumber"),
      customerId: sarahId,
      customerName: sarahName,
      providerId: marcus.p.id,
      providerName: marcus.p.name,
      service: "Plumber",
      date: dateOffset(5),
      time: "14:00",
      hours: 2,
      estimatedCost: marcus.cost(2),
      status: "confirmed",
      paymentStatus: "authorized",
      respondedAt: new Date(now - 43200000).toISOString(),
      createdAt: new Date(now - 86400000).toISOString(),
    });
  }

  if (david) {
    rows.push({
      id: demoId("booking:sarah-pending-paint"),
      customerId: sarahId,
      customerName: sarahName,
      providerId: david.p.id,
      providerName: david.p.name,
      service: "Painting",
      date: dateOffset(7),
      time: "11:00",
      hours: 4,
      estimatedCost: david.cost(4),
      status: "pending",
      paymentStatus: "none",
      createdAt: new Date(now - 7200000).toISOString(),
    });
  }

  if (nina) {
    rows.push({
      id: demoId("booking:sarah-completed-clean"),
      customerId: sarahId,
      customerName: sarahName,
      providerId: nina.p.id,
      providerName: nina.p.name,
      service: "House Cleaning",
      date: dateOffset(-10),
      time: "09:00",
      hours: 3,
      estimatedCost: nina.cost(3),
      status: "completed",
      paymentStatus: "released",
      respondedAt: new Date(now - 11 * 86400000).toISOString(),
      completedAt: new Date(now - 10 * 86400000).toISOString(),
      createdAt: new Date(now - 12 * 86400000).toISOString(),
    });
  }

  if (marcus) {
    rows.push({
      id: demoId("booking:sarah-completed-plumber"),
      customerId: sarahId,
      customerName: sarahName,
      providerId: marcus.p.id,
      providerName: marcus.p.name,
      service: "Plumber",
      date: dateOffset(-21),
      time: "15:00",
      hours: 2,
      estimatedCost: marcus.cost(2),
      status: "completed",
      paymentStatus: "released",
      respondedAt: new Date(now - 22 * 86400000).toISOString(),
      completedAt: new Date(now - 21 * 86400000).toISOString(),
      createdAt: new Date(now - 23 * 86400000).toISOString(),
    });
  }

  return rows;
}

export function buildSarahWorkspaceNotifications(sarahUserId: string): MockNotification[] {
  const now = Date.now();
  return [
    {
      id: demoId("notif:sarah-1"),
      userId: sarahUserId,
      type: "booking",
      title: "Booking confirmed",
      message: "Nina Patel confirmed your House Cleaning for this week.",
      read: false,
      href: "/customer/dashboard",
      createdAt: new Date(now - 3600000).toISOString(),
    },
    {
      id: demoId("notif:sarah-2"),
      userId: sarahUserId,
      type: "booking",
      title: "Provider accepted your request",
      message: "Marcus Reed accepted your Plumber booking.",
      read: false,
      href: "/customer/dashboard",
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: demoId("notif:sarah-3"),
      userId: sarahUserId,
      type: "message",
      title: "New message received",
      message: "Nina Patel: I'll bring eco-friendly supplies — see you soon!",
      read: false,
      href: "/customer/dashboard",
      createdAt: new Date(now - 1800000).toISOString(),
    },
  ];
}
