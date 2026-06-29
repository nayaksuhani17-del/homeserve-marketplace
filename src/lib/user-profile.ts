import type { MockDatabase, MockUser } from "@/lib/mock/types";
import {
  parseLocationInput,
  locationMatchingKey,
  resolveCustomerAddress,
  enrichCustomerLocation,
  type CustomerLocation,
} from "@/lib/location";

export type RegistrationProfileInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "User", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function buildFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function publicDisplayName(
  user: Pick<MockUser, "firstName" | "lastName" | "name">
): string {
  const first = user.firstName?.trim() || splitFullName(user.name).firstName;
  const last = user.lastName?.trim() || splitFullName(user.name).lastName;
  if (!last) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export function publicInitial(
  user: Pick<MockUser, "firstName" | "lastName" | "name">
): string {
  const first = user.firstName?.trim() || splitFullName(user.name).firstName;
  return (first.charAt(0) || "U").toUpperCase();
}

export function extractCity(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "Local area";
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 2]!;
  if (parts.length >= 2) return parts[parts.length - 1]!;
  return trimmed;
}

export function validateRegistrationProfile(input: RegistrationProfileInput): string | null {
  if (!input.firstName.trim()) return "First name is required.";
  if (!input.lastName.trim()) return "Last name is required.";
  if (!input.email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(input.email.trim())) return "Enter a valid email address.";
  if (!input.phoneNumber.trim()) return "Phone number is required.";
  if (!input.address.trim()) return "Address is required.";
  if (!input.password.trim()) return "Password is required.";
  if (input.password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

function providerUserId(db: MockDatabase, providerId: string): string | undefined {
  return db.providers.find((p) => p.id === providerId)?.userId;
}

export function hasConfirmedBookingBetween(
  db: MockDatabase,
  userIdA: string,
  userIdB: string
): boolean {
  return db.bookings.some((booking) => {
    const providerUser = providerUserId(db, booking.providerId);
    if (!providerUser) return false;
    const between =
      (booking.customerId === userIdA && providerUser === userIdB) ||
      (booking.customerId === userIdB && providerUser === userIdA);
    if (!between) return false;
    return booking.status === "confirmed" || booking.status === "completed";
  });
}

export function canRevealContact(
  db: MockDatabase,
  viewerId: string,
  targetUserId: string,
  options?: { inActiveChat?: boolean }
): boolean {
  if (viewerId === targetUserId) return true;
  if (options?.inActiveChat) return true;
  return hasConfirmedBookingBetween(db, viewerId, targetUserId);
}

export type RevealedContact = {
  phoneNumber: string;
  city: string;
};

export function getRevealedContact(user: MockUser): RevealedContact {
  return {
    phoneNumber: user.phoneNumber,
    city: extractCity(user.address),
  };
}

export function ensureUserProfileFields(user: MockUser): MockUser {
  const split = splitFullName(user.name);
  const firstName = user.firstName?.trim() || split.firstName;
  const lastName = user.lastName?.trim() || split.lastName || "User";
  const phoneNumber = user.phoneNumber?.trim() || "(555) 000-0000";
  const demoAddress = resolveCustomerAddress({
    address: user.address,
    location: user.location,
    email: user.email,
  });

  let location: CustomerLocation | undefined = user.location;
  if (location?.raw.trim()) {
    location = enrichCustomerLocation(location);
  } else if (user.address?.trim()) {
    location = enrichCustomerLocation(user.address);
  } else if (demoAddress && demoAddress !== "Your City") {
    location = enrichCustomerLocation(demoAddress);
  }

  const address = location
    ? locationMatchingKey(location)
    : demoAddress;

  return {
    ...user,
    firstName,
    lastName,
    phoneNumber,
    address,
    location,
    name: buildFullName(firstName, lastName),
  };
}
