import { demoId } from "@/lib/demo/ids";
import { DEFAULT_WEEK_AVAILABILITY } from "./normalize";
import type { MockProvider, MockUser } from "./types";

export function newGuestUser(input: {
  name: string;
  email: string;
  password: string;
  customerRole: boolean;
  providerRole: boolean;
}): MockUser {
  const customerRole = input.customerRole;
  const providerRole = input.providerRole;
  const role =
    providerRole && !customerRole ? "provider" : customerRole ? "customer" : "provider";
  return {
    id: demoId(`guest-user:${input.email.toLowerCase()}`),
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role,
    customerRole,
    providerRole,
    banned: false,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email)}`,
    createdAt: new Date().toISOString(),
  };
}

export function newGuestProvider(user: MockUser): MockProvider {
  return {
    id: demoId(`guest-provider:${user.id}`),
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    services: ["House Cleaning"],
    pricingType: "fixed",
    price: 95,
    basePrice: 95,
    hourlyRate: 0,
    servicePackages: [
      { label: "Standard home clean", price: 95 },
      { label: "Deep house cleaning", price: 150 },
    ],
    location: "Your City",
    description: "Tell customers about your experience and services.",
    availability: "Mon-Fri: 9am-5pm",
    ratingAvg: 4.5,
    approved: true,
    distanceMiles: 3,
    jobsCompleted: 0,
    yearsExperience: 1,
    tags: [],
    availableToday: true,
    availableTomorrow: true,
    weekAvailability: [...DEFAULT_WEEK_AVAILABILITY],
    responseTimeMins: 30,
    responseSpeed: "fast",
    reviewCount: 0,
    blockedSlots: [],
    rejected: false,
  };
}

export function newId(prefix: string): string {
  return demoId(`${prefix}:${Date.now()}:${Math.random()}`);
}
