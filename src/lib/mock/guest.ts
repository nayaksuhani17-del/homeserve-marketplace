import { demoId } from "@/lib/demo/ids";
import {
  buildFullName,
  publicDisplayName,
  splitFullName,
} from "@/lib/user-profile";
import { DEFAULT_WEEKLY_SCHEDULE, formatAvailabilitySummary } from "@/lib/availability";
import { defaultAvailabilityConfig } from "@/lib/availability-config";
import { normalizeLocation } from "@/lib/location";
import type { MockProvider, MockUser } from "./types";

export type GuestUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  customerRole: boolean;
  providerRole: boolean;
};

export function newGuestUser(input: GuestUserInput): MockUser {
  const customerRole = input.customerRole;
  const providerRole = input.providerRole;
  const role =
    providerRole && !customerRole ? "provider" : customerRole ? "customer" : "provider";
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  return {
    id: demoId(`guest-user:${input.email.toLowerCase()}`),
    name: buildFullName(firstName, lastName),
    firstName,
    lastName,
    email: input.email.toLowerCase(),
    phoneNumber: input.phoneNumber.trim(),
    address: input.address.trim(),
    password: input.password,
    role,
    customerRole,
    providerRole,
    banned: false,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email)}`,
    createdAt: new Date().toISOString(),
  };
}

/** Test/helper — builds a guest from a display name with default contact fields. */
export function newGuestUserFromName(input: {
  name: string;
  email: string;
  password: string;
  customerRole: boolean;
  providerRole: boolean;
}): MockUser {
  const { firstName, lastName } = splitFullName(input.name);
  return newGuestUser({
    firstName,
    lastName: lastName || "User",
    email: input.email,
    phoneNumber: "(555) 010-0000",
    address: "123 Test Street, Springfield, IL 62701",
    password: input.password,
    customerRole: input.customerRole,
    providerRole: input.providerRole,
  });
}

export function newGuestProvider(user: MockUser): MockProvider {
  return {
    id: demoId(`guest-provider:${user.id}`),
    userId: user.id,
    name: publicDisplayName(user),
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
    location: normalizeLocation(user.address),
    address: normalizeLocation(user.address),
    description: "Tell customers about your experience and services.",
    availability: formatAvailabilitySummary(DEFAULT_WEEKLY_SCHEDULE),
    ratingAvg: 0,
    verified: false,
    approved: false,
    distanceMiles: 3,
    jobsCompleted: 0,
    yearsExperience: 1,
    tags: [],
    availableToday: true,
    availableTomorrow: true,
    weekAvailability: DEFAULT_WEEKLY_SCHEDULE.map((entry) => entry.enabled),
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry })),
    availabilityConfig: defaultAvailabilityConfig(),
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
