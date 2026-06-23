import { cookies } from "next/headers";
import { demoId } from "./ids";
import {
  DEMO_BOOKINGS,
  getDemoUserByEmail,
  getDemoUserByKey,
  providerId,
  userId,
  type DemoUserSeed,
} from "./seed-data";
import { getDemoProviderById } from "./providers";
import { getProviderUser } from "../providers";

export const DEMO_SESSION_COOKIE = "homeserve-demo-session";

export type DemoSessionUser = {
  key: string;
  name: string;
  email: string;
  role: "admin" | "customer" | "provider";
};

export type DemoSessionBooking = {
  id: string;
  providerId: string;
  providerName: string;
  service: string;
  date: string;
  time?: string | null;
  status: "pending" | "confirmed";
};

export type DemoSession = {
  user: DemoSessionUser;
  bookings: DemoSessionBooking[];
};

function seedBookingsForCustomer(customerKey: string): DemoSessionBooking[] {
  return DEMO_BOOKINGS.filter((b) => b.customerKey === customerKey).map((b, i) => {
    const provider = getDemoProviderById(providerId(b.providerKey));
    const providerUser = provider ? getProviderUser(provider) : null;
    return {
      id: demoId(`demo-booking:${customerKey}:${i}`),
      providerId: providerId(b.providerKey),
      providerName: providerUser?.name ?? "Provider",
      service: b.service,
      date: b.date,
      status: b.status,
    };
  });
}

export function createDemoSession(user: DemoUserSeed): DemoSession {
  const bookings =
    user.role === "customer" ? seedBookingsForCustomer(user.key) : [];

  return {
    user: {
      key: user.key,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    bookings,
  };
}

export function getDemoUserId(session: DemoSession): string {
  return userId(session.user.key);
}

export async function readDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeDemoSession(session: DemoSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}

export async function appendDemoBooking(
  booking: Omit<DemoSessionBooking, "id"> & { id?: string }
) {
  const session = await readDemoSession();
  if (!session) return null;

  const entry: DemoSessionBooking = {
    id: booking.id ?? demoId(`demo-booking:${Date.now()}`),
    providerId: booking.providerId,
    providerName: booking.providerName,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    status: booking.status ?? "pending",
  };

  session.bookings = [entry, ...session.bookings];
  await writeDemoSession(session);
  return entry;
}

export function resolveDemoUser(email?: string, role?: "customer" | "provider" | "admin") {
  if (email) return getDemoUserByEmail(email);
  if (role === "admin") return getDemoUserByKey("admin");
  if (role === "provider") return getDemoUserByKey("provider-marcus");
  return getDemoUserByKey("customer-sarah");
}

export function createGuestDemoSession(input: {
  name: string;
  email: string;
  role: "customer" | "provider" | "admin";
}): DemoSession {
  const key = demoId(`guest:${input.email.toLowerCase()}`);
  return {
    user: {
      key,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
    },
    bookings: input.role === "customer" ? [] : [],
  };
}

export function demoRedirectForRole(role: DemoSessionUser["role"]) {
  if (role === "admin") return "/admin";
  if (role === "provider") return "/provider/dashboard";
  return "/customer/dashboard";
}

export function getDemoProviderForUser(userKey: string) {
  if (!userKey.startsWith("provider-")) return null;
  return getDemoProviderById(providerId(userKey));
}
