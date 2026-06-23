import { estimateBookingCost } from "@/lib/pricing";
import { demoId } from "@/lib/demo/ids";
import { userId } from "@/lib/demo/seed-data";
import type { MockBooking, MockNotification, MockProvider, MockUser } from "./types";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + hours);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

/** Rich workspace data for the Marcus Reed demo provider dashboard. */
export function buildMarcusWorkspaceBookings(
  providers: MockProvider[],
  users: MockUser[]
): MockBooking[] {
  const marcus = providers.find((p) => p.email === "marcus.reed@demo.com");
  if (!marcus) return [];

  const name = (key: string) => users.find((u) => u.id === userId(key))?.name ?? "Customer";
  const rate = marcus.hourlyRate || marcus.price;
  const cost = (hours: number) => estimateBookingCost(marcus.pricingType, rate, hours);

  const now = Date.now();

  return [
    {
      id: demoId("booking:marcus-pending-1"),
      customerId: userId("customer-james"),
      customerName: name("customer-james"),
      providerId: marcus.id,
      providerName: marcus.name,
      service: "Plumber",
      date: dateOffset(2),
      time: "14:00",
      hours: 2,
      estimatedCost: cost(2),
      status: "pending",
      paymentStatus: "none",
      createdAt: new Date(now - 3600000).toISOString(),
    },
    {
      id: demoId("booking:marcus-pending-2"),
      customerId: userId("customer-emily"),
      customerName: name("customer-emily"),
      providerId: marcus.id,
      providerName: marcus.name,
      service: "Electrician",
      date: dateOffset(1),
      time: "10:00",
      hours: 3,
      estimatedCost: cost(3),
      status: "pending",
      paymentStatus: "none",
      createdAt: new Date(now - 7200000).toISOString(),
    },
    {
      id: demoId("booking:marcus-pending-3"),
      customerId: userId("customer-michael"),
      customerName: name("customer-michael"),
      providerId: marcus.id,
      providerName: marcus.name,
      service: "Plumber",
      date: dateOffset(3),
      time: "16:00",
      hours: 2,
      estimatedCost: cost(2),
      status: "pending",
      paymentStatus: "none",
      createdAt: new Date(now - 1800000).toISOString(),
    },
    {
      id: demoId("booking:marcus-upcoming-soon"),
      customerId: userId("customer-sarah"),
      customerName: name("customer-sarah"),
      providerId: marcus.id,
      providerName: marcus.name,
      service: "Plumber",
      date: dateOffset(0),
      time: hoursFromNow(1),
      hours: 2,
      estimatedCost: cost(2),
      status: "confirmed",
      paymentStatus: "authorized",
      respondedAt: new Date(now - 86400000).toISOString(),
      createdAt: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: demoId("booking:marcus-upcoming-2"),
      customerId: userId("customer-jessica"),
      customerName: name("customer-jessica"),
      providerId: marcus.id,
      providerName: marcus.name,
      service: "Electrician",
      date: dateOffset(4),
      time: "11:00",
      hours: 2,
      estimatedCost: cost(2),
      status: "confirmed",
      paymentStatus: "authorized",
      respondedAt: new Date(now - 43200000).toISOString(),
      createdAt: new Date(now - 86400000).toISOString(),
    },
    ...[0, 1, 2, 3, 5].map((daysAgo, i) => ({
      id: demoId(`booking:marcus-completed-${i}`),
      customerId: userId(["customer-sarah", "customer-james", "customer-emily", "customer-michael", "customer-jessica"][i]!),
      customerName: name(["customer-sarah", "customer-james", "customer-emily", "customer-michael", "customer-jessica"][i]!),
      providerId: marcus.id,
      providerName: marcus.name,
      service: i % 2 === 0 ? "Plumber" : "Electrician",
      date: dateOffset(-daysAgo),
      time: "10:00",
      hours: 2,
      estimatedCost: cost(2) + i * 15,
      status: "completed" as const,
      paymentStatus: "released" as const,
      respondedAt: new Date(now - daysAgo * 86400000 - 3600000).toISOString(),
      completedAt: new Date(now - daysAgo * 86400000).toISOString(),
      createdAt: new Date(now - (daysAgo + 1) * 86400000).toISOString(),
    })),
  ];
}

export function buildMarcusWorkspaceNotifications(marcusUserId: string): MockNotification[] {
  const now = Date.now();
  return [
    {
      id: demoId("notif:marcus-1"),
      userId: marcusUserId,
      type: "booking",
      title: "You have a new job request",
      message: "James Carter requested a Plumber for this week. Review and respond.",
      read: false,
      href: "/provider/dashboard",
      createdAt: new Date(now - 3600000).toISOString(),
    },
    {
      id: demoId("notif:marcus-2"),
      userId: marcusUserId,
      type: "booking",
      title: "Job starting in 1 hour",
      message: "Your Plumber appointment with Sarah Mitchell is coming up soon.",
      read: false,
      href: "/provider/dashboard",
      createdAt: new Date(now - 600000).toISOString(),
    },
    {
      id: demoId("notif:marcus-3"),
      userId: marcusUserId,
      type: "system",
      title: "New review received",
      message: "Sarah Mitchell left a 5-star review on your recent job.",
      read: false,
      href: "/provider/dashboard",
      createdAt: new Date(now - 86400000).toISOString(),
    },
  ];
}
