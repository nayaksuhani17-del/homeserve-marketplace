"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { normalizeMockDatabase } from "@/lib/mock/normalize";
import { newGuestProvider, newGuestUser, newId } from "@/lib/mock/guest";
import { loadDb, saveDb } from "@/lib/mock/load-db";
import {
  addReviewRecord,
  addNotificationRecord,
  approveProviderRecord,
  banUserRecord,
  cancelBookingRecord,
  completeBookingRecord,
  createBookingRecord,
  dismissReportRecord,
  filterMockProviders,
  getTopRankedProviders,
  getReviewsForProvider,
  getStats,
  mockProviderToLegacy,
  markNotificationsReadRecord,
  registerUserRecord,
  rejectProviderRecord,
  resolveBookingRecord,
  resolveReportRecord,
  addChatMessageRecord,
  removeReviewRecord,
  simulateDelay,
  submitReportRecord,
  toggleProviderBlockedSlotRecord,
  updateProviderRecord,
  validateReview,
} from "@/lib/mock/operations";
import { getMarketplaceAnalytics } from "@/lib/mock/analytics";
import type {
  MarketplaceAnalytics,
  MockBooking,
  MockDatabase,
  MockNotification,
  MockProvider,
  MockSession,
  MockUser,
  ProviderFilters,
  SystemEvent,
} from "@/lib/mock/types";
import {
  MOCK_DB_KEY,
  MOCK_SESSION_KEY,
} from "@/lib/mock/types";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import { DEMO_MODE, DEMO_PROVIDER_PAGE_SIZE, DEMO_ROLE_REDIRECT } from "@/lib/demo/mode";
import { assignRecommendationLabels } from "@/lib/recommendations";
import { toProviderCardData, rankProviders } from "@/lib/providers";
import { detectUrgency } from "@/lib/smart";
import { parseSearchFallback } from "@/lib/ai/parse-search";
import { parseAssistantContext } from "@/lib/ai/parse-intent";
import { resolveIntentFast } from "@/lib/ai/intent-fast";
import {
  generateProviderChatReply,
  getAvailabilityHint as getAvailabilityHintForProvider,
  getAvailableSlots as getAvailableSlotsForProvider,
  getChatReplyDelayMs,
  getNextAvailableSlot,
  getResponseDelayMs,
  getResponseSpeed,
  shouldAcceptBooking,
} from "@/lib/mock/simulation";
import {
  incrementProviderClick,
  loadFavoriteIds,
  loadRecentProviderIds,
  saveFavoriteIds,
  trackRecentProvider,
} from "@/lib/smart";
import type { RecommendationLabel } from "@/lib/recommendations";

export const SYSTEM_EVENT = "homeserve-system-event";

type MockAppContextValue = {
  ready: boolean;
  db: MockDatabase | null;
  session: MockSession | null;
  user: MockUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<{ error?: string; redirect?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "customer" | "provider"
  ) => Promise<{ error?: string; redirect?: string }>;
  demoLogin: (
    role: "customer" | "provider" | "admin",
    redirectTo?: string
  ) => Promise<{ error?: string; redirect?: string }>;
  logout: () => void;
  createBooking: (input: {
    providerId: string;
    service: string;
    date: string;
    time?: string | null;
    hours: number;
  }) => Promise<{ error?: string; booking?: MockDatabase["bookings"][0] }>;
  completeBooking: (bookingId: string) => Promise<{ error?: string }>;
  getAvailableSlots: (providerId: string, date: string) => string[];
  sendChatMessage: (bookingId: string, text: string) => Promise<{ error?: string }>;
  getChatMessages: (bookingId: string) => MockDatabase["chatMessages"];
  removeReview: (reviewId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<{ error?: string }>;
  respondToBooking: (
    bookingId: string,
    accepted: boolean
  ) => Promise<{ error?: string }>;
  reportProvider: (input: {
    providerId: string;
    bookingId?: string;
    reason: string;
    details: string;
  }) => Promise<{ error?: string }>;
  resolveReport: (reportId: string) => Promise<void>;
  dismissReport: (reportId: string) => Promise<void>;
  banProviderFromReport: (reportId: string) => Promise<void>;
  getNotifications: () => MockNotification[];
  unreadNotificationCount: number;
  markNotificationsRead: (ids?: string[]) => void;
  getAnalytics: () => MarketplaceAnalytics;
  toggleBlockedSlot: (date: string, time: string) => Promise<{ error?: string }>;
  getAvailabilityHint: (providerId: string) => string;
  getRebookPrefill: (providerId: string) => Partial<MockBooking> | null;
  systemEvents: SystemEvent[];
  addReview: (input: {
    providerId: string;
    bookingId?: string;
    rating: number;
    comment: string;
  }) => Promise<{ error?: string }>;
  updateProvider: (patch: {
    services?: string[];
    pricingType?: MockProvider["pricingType"];
    price?: number;
    basePrice?: number;
    hourlyRate?: number;
    servicePackages?: MockProvider["servicePackages"];
    location?: string;
    description?: string;
    availability?: string;
    availableToday?: boolean;
    availableTomorrow?: boolean;
    weekAvailability?: boolean[];
  }) => Promise<{ error?: string }>;
  approveProvider: (providerId: string, approved: boolean) => Promise<void>;
  rejectProvider: (providerId: string) => Promise<void>;
  banUser: (userId: string, banned: boolean) => Promise<void>;
  filterProviders: (filters: ProviderFilters) => ReturnType<typeof filterMockProviders> & {
    topRanked: MockProvider[];
    topRankMap: Record<string, number>;
    recommendationMap: Record<string, RecommendationLabel>;
    bestMatchId?: string;
    urgent: boolean;
  };
  getProvider: (id: string) => MockProvider | undefined;
  trackProviderView: (providerId: string) => void;
  trackProviderClick: (providerId: string) => void;
  isFavorite: (providerId: string) => boolean;
  toggleFavorite: (providerId: string) => boolean;
  getSavedProviders: () => MockProvider[];
  getRecentlyViewedProviders: () => MockProvider[];
  getProviderReviews: (providerId: string) => ReturnType<typeof getReviewsForProvider>;
  getProviderForUser: (userId: string) => MockProvider | undefined;
  getBookingsForCustomer: (customerId: string) => MockDatabase["bookings"];
  getBookingsForProvider: (providerId: string) => MockDatabase["bookings"];
  getStats: () => ReturnType<typeof getStats>;
  assist: (message: string) => {
    message: string;
    service?: string;
    chips: string[];
    providers: ReturnType<typeof toProviderCardData>[];
  };
  parseSearch: (query: string) => ProviderFilters & { redirectParams: URLSearchParams };
};

const MockAppContext = createContext<MockAppContextValue | null>(null);

function loadSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: MockSession | null) {
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

const DEMO_ROLE_EMAIL: Record<"customer" | "provider" | "admin", string> = {
  customer: "sarah.mitchell@demo.com",
  provider: "marcus.reed@demo.com",
  admin: "admin@test.com",
};

export function MockAppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<MockDatabase | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const responseTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resumedPending = useRef(new Set<string>());
  const saveDbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterCacheRef = useRef<{
    db: MockDatabase;
    key: string;
    result: ReturnType<MockAppContextValue["filterProviders"]>;
  } | null>(null);

  const clearScheduledResponse = useCallback((bookingId: string) => {
    const existing = responseTimeouts.current.get(bookingId);
    if (existing) {
      clearTimeout(existing);
      responseTimeouts.current.delete(bookingId);
    }
  }, []);

  const appendNotification = useCallback(
    (
      sourceDb: MockDatabase,
      userId: string,
      notification: Omit<MockNotification, "id" | "userId" | "read" | "createdAt">
    ): MockDatabase => {
      return addNotificationRecord(sourceDb, {
        id: newId("notif"),
        userId,
        ...notification,
      });
    },
    []
  );

  const notifyBookingParties = useCallback(
    (
      sourceDb: MockDatabase,
      booking: MockBooking,
      customerPayload: Omit<MockNotification, "id" | "userId" | "read" | "createdAt">,
      providerUserId?: string,
      providerPayload?: Omit<MockNotification, "id" | "userId" | "read" | "createdAt">
    ): MockDatabase => {
      let next = appendNotification(sourceDb, booking.customerId, customerPayload);
      if (providerUserId && providerPayload) {
        next = appendNotification(next, providerUserId, providerPayload);
      }
      return next;
    },
    [appendNotification]
  );

  const emitSystemEvent = useCallback((event: Omit<SystemEvent, "id" | "at">) => {
    const full: SystemEvent = {
      ...event,
      id: newId("event"),
      at: new Date().toISOString(),
    };
    setSystemEvents((prev) => [full, ...prev].slice(0, 24));
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(SYSTEM_EVENT, { detail: full }));
      });
    }
  }, []);

  const scheduleBookingResponse = useCallback(
    (bookingId: string, sourceDb: MockDatabase) => {
      const booking = sourceDb.bookings.find((b) => b.id === bookingId);
      if (!booking || booking.status !== "pending") return;

      const provider = sourceDb.providers.find((p) => p.id === booking.providerId);
      if (!provider) return;

      const existing = responseTimeouts.current.get(bookingId);
      if (existing) clearTimeout(existing);

      const delay = getResponseDelayMs(getResponseSpeed(provider));
      const timeout = setTimeout(() => {
        responseTimeouts.current.delete(bookingId);
        setDb((prev) => {
          if (!prev) return prev;
          const current = prev.bookings.find((b) => b.id === bookingId);
          if (!current || current.status !== "pending") return prev;

          const accepted = shouldAcceptBooking(bookingId);
          let next = resolveBookingRecord(prev, bookingId, accepted);
          const providerUser = prev.providers.find(
            (p) => p.id === current.providerId
          );
          const providerAccount = providerUser
            ? prev.users.find((u) => u.id === providerUser.userId)
            : undefined;

          if (accepted) {
            next = notifyBookingParties(
              next,
              { ...current, status: "confirmed", paymentStatus: "authorized" },
              {
                type: "booking",
                title: "Booking confirmed",
                message: `${current.providerName} accepted your ${current.service} request.`,
                href: "/customer/dashboard",
              },
              providerAccount?.id,
              {
                type: "booking",
                title: "Job confirmed",
                message: `You accepted ${current.customerName}'s booking.`,
                href: "/provider/dashboard",
              }
            );
            emitSystemEvent({
              type: "booking_accepted",
              message: `${current.providerName} just accepted a job`,
            });

            if (DEMO_MODE) {
              const completeTimeout = setTimeout(() => {
                responseTimeouts.current.delete(`complete:${bookingId}`);
                setDb((prev) => {
                  if (!prev) return prev;
                  const live = prev.bookings.find((b) => b.id === bookingId);
                  if (!live || live.status !== "confirmed") return prev;
                  let completed = completeBookingRecord(prev, bookingId);
                  completed = appendNotification(completed, live.customerId, {
                    type: "payment",
                    title: "Job complete",
                    message: `Your ${live.service} job with ${live.providerName} is complete. Leave a review!`,
                    href: "/customer/dashboard",
                  });
                  saveDb(completed);
                  emitSystemEvent({
                    type: "job_completed",
                    message: `${live.service} job marked complete`,
                  });
                  return completed;
                });
              }, 1200);
              responseTimeouts.current.set(`complete:${bookingId}`, completeTimeout);
            }
          } else {
            next = appendNotification(next, current.customerId, {
              type: "booking",
              title: "Booking declined",
              message: `${current.providerName} couldn't take your ${current.service} request.`,
              href: "/customer/dashboard",
            });
            emitSystemEvent({
              type: "booking_declined",
              message: `${current.providerName} declined a booking request`,
            });
          }

          saveDb(next);

          return next;
        });
      }, delay);

      responseTimeouts.current.set(bookingId, timeout);
    },
    [emitSystemEvent, appendNotification, notifyBookingParties]
  );

  useLayoutEffect(() => {
    let cancelled = false;

    function finishBootstrap(stored: MockDatabase, nextSession: MockSession | null) {
      if (cancelled) return;
      setDb(stored);
      setSession(nextSession);
      setFavoriteIds(loadFavoriteIds());
      setReady(true);
    }

    const stored = loadDb();
    if (stored) {
      finishBootstrap(stored, loadSession());
      return () => {
        cancelled = true;
      };
    }

    const hadStaleDb =
      typeof window !== "undefined" && Boolean(localStorage.getItem(MOCK_DB_KEY));

    void import("@/lib/mock/seed").then(({ buildInitialDatabase }) => {
      if (cancelled) return;
      const fresh = buildInitialDatabase();
      saveDb(fresh);
      if (hadStaleDb) saveSession(null);
      finishBootstrap(fresh, hadStaleDb ? null : loadSession());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !db) return;
    db.bookings
      .filter((b) => b.status === "pending")
      .forEach((b) => {
        if (!resumedPending.current.has(b.id)) {
          resumedPending.current.add(b.id);
          scheduleBookingResponse(b.id, db);
        }
      });
  }, [ready, db, scheduleBookingResponse]);

  useEffect(() => {
    const timeouts = responseTimeouts.current;
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
      if (saveDbTimerRef.current) clearTimeout(saveDbTimerRef.current);
    };
  }, []);

  const persist = useCallback((next: MockDatabase) => {
    const normalized = normalizeMockDatabase(next);
    filterCacheRef.current = null;
    setDb(normalized);
    if (saveDbTimerRef.current) clearTimeout(saveDbTimerRef.current);
    saveDbTimerRef.current = setTimeout(() => {
      localStorage.setItem(MOCK_DB_KEY, JSON.stringify(normalized));
      saveDbTimerRef.current = null;
    }, 400);
  }, []);

  const user = useMemo(() => {
    if (!db || !session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }, [db, session]);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      if (!db) return { error: "App not ready" };
      setLoading(true);
      await simulateDelay();
      const found = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found) {
        setLoading(false);
        return { error: "No account found with that email." };
      }
      if (found.banned) {
        setLoading(false);
        return { error: "Your account has been banned." };
      }
      if (found.password !== password) {
        setLoading(false);
        return { error: "Incorrect password." };
      }
      const sess = { userId: found.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      if (redirectTo) return { redirect: redirectTo };
      const redirect =
        found.role === "admin"
          ? "/admin"
          : found.role === "provider"
            ? "/provider/dashboard"
            : "/customer/dashboard";
      return { redirect };
    },
    [db]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "customer" | "provider"
    ) => {
      if (!db) return { error: "App not ready" };
      if (!name.trim() || !email.trim() || !password.trim()) {
        return { error: "Please fill all fields." };
      }
      if (password.length < 6) {
        return { error: "Password must be at least 6 characters." };
      }
      setLoading(true);
      await simulateDelay();
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        return { error: "An account with this email already exists." };
      }
      const guest = newGuestUser({ name, email, password, role });
      const provider = role === "provider" ? newGuestProvider(guest) : undefined;
      const next = registerUserRecord(db, guest, provider);
      persist(next);
      const sess = { userId: guest.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      const redirect =
        role === "provider" ? "/provider/dashboard" : "/customer/dashboard";
      return { redirect };
    },
    [db, persist]
  );

  const demoLogin = useCallback(
    async (role: "customer" | "provider" | "admin", redirectTo?: string) => {
      if (!db) return { error: "App not ready" };
      setLoading(true);
      await simulateDelay(DEMO_MODE ? 200 : 400);
      const email = DEMO_ROLE_EMAIL[role];
      const found = db.users.find((u) => u.email === email);
      if (!found) {
        setLoading(false);
        return { error: "Demo user not found." };
      }
      const sess = { userId: found.id };
      setSession(sess);
      saveSession(sess);
      setLoading(false);
      return { redirect: redirectTo ?? DEMO_ROLE_REDIRECT[role] };
    },
    [db]
  );

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  const createBooking = useCallback(
    async (input: {
      providerId: string;
      service: string;
      date: string;
      time?: string | null;
      hours: number;
    }) => {
      if (!db || !user) return { error: "You must be logged in to book." };
      if (!input.service.trim() || !input.date.trim()) {
        return { error: "Please fill all fields." };
      }
      if (!input.time) {
        return { error: "Please select an available time slot." };
      }
      await simulateDelay(DEMO_MODE ? 300 : 1000);
      const provider = db.providers.find((p) => p.id === input.providerId);
      if (!provider) {
        return { error: "Provider not found." };
      }
      if (!provider.approved) {
        return { error: "This provider is not approved yet." };
      }
      const providerUser = db.users.find((u) => u.id === provider.userId);
      if (providerUser?.banned) {
        return { error: "This provider is no longer available." };
      }
      const id = newId("booking");
      const result = createBookingRecord(
        db,
        { ...input, customerId: user.id },
        id
      );
      if (result.error) {
        return { error: result.error };
      }
      resumedPending.current.add(id);
      scheduleBookingResponse(id, result.db);

      const providerAccount = result.db.users.find((u) => u.id === provider.userId);
      let next = appendNotification(result.db, user.id, {
        type: "booking",
        title: "Request sent",
        message: `Waiting for ${provider.name} to respond to your ${input.service} request.`,
        href: "/customer/dashboard",
      });
      if (providerAccount) {
        next = appendNotification(next, providerAccount.id, {
          type: "booking",
          title: "New job request",
          message: `${user.name} requested ${input.service} on ${input.date}.`,
          href: "/provider/dashboard",
        });
      }
      persist(next);

      emitSystemEvent({
        type: "booking_created",
        message: "New booking in your area",
      });
      return { booking: result.db.bookings.find((b) => b.id === id) };
    },
    [db, user, persist, scheduleBookingResponse, emitSystemEvent, appendNotification]
  );

  const completeBooking = useCallback(
    async (bookingId: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: "Booking not found." };
      if (booking.status !== "confirmed") {
        return { error: "Only confirmed jobs can be marked complete." };
      }
      setLoading(true);
      await simulateDelay(500);
      let next = completeBookingRecord(db, bookingId);
      next = appendNotification(next, booking.customerId, {
        type: "payment",
        title: "Job complete",
        message: `${booking.providerName} marked your ${booking.service} job complete. Payment released.`,
        href: "/customer/dashboard",
      });
      persist(next);
      emitSystemEvent({
        type: "job_completed",
        message: `${booking.service} job marked complete`,
      });
      emitSystemEvent({
        type: "payment",
        message: `Payment released for ${booking.customerName}`,
      });
      setLoading(false);
      return {};
    },
    [db, user, persist, emitSystemEvent, appendNotification]
  );

  const getAvailableSlots = useCallback(
    (providerId: string, date: string) => {
      if (!db) return [];
      return getAvailableSlotsForProvider(db, providerId, date);
    },
    [db]
  );

  const getChatMessages = useCallback(
    (bookingId: string) =>
      (db?.chatMessages ?? [])
        .filter((m) => m.bookingId === bookingId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [db]
  );

  const sendChatMessage = useCallback(
    async (bookingId: string, text: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: "Booking not found." };
      if (booking.status !== "confirmed" && booking.status !== "completed") {
        return { error: "Chat is available after the provider confirms your booking." };
      }

      const providerRecord = db.providers.find((p) => p.userId === user.id);
      const senderRole =
        user.role === "provider" && providerRecord?.id === booking.providerId
          ? "provider"
          : user.role === "customer" && booking.customerId === user.id
            ? "customer"
            : null;
      if (!senderRole) return { error: "You cannot message on this booking." };

      const next = addChatMessageRecord(db, {
        id: newId("chat"),
        bookingId,
        senderRole,
        senderName: user.name,
        text,
      });
      persist(next);

      if (senderRole === "customer") {
        const replyDelay = getChatReplyDelayMs();
        setTimeout(() => {
          setDb((prev) => {
            if (!prev) return prev;
            const reply = generateProviderChatReply(text);
            const withReply = addChatMessageRecord(prev, {
              id: newId("chat"),
              bookingId,
              senderRole: "provider",
              senderName: booking.providerName,
              text: reply,
            });
            saveDb(withReply);
            return withReply;
          });
        }, replyDelay);
      }

      return {};
    },
    [db, user, persist]
  );

  const removeReview = useCallback(
    async (reviewId: string) => {
      if (!db) return;
      setLoading(true);
      await simulateDelay(400);
      persist(removeReviewRecord(db, reviewId));
      emitSystemEvent({
        type: "report",
        message: "Review removed — provider rating updated",
      });
      setLoading(false);
    },
    [db, persist, emitSystemEvent]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: "Booking not found." };

      const provider = db.providers.find((p) => p.id === booking.providerId);
      const isCustomer = user.id === booking.customerId;
      const isProvider = provider?.userId === user.id;
      const isAdmin = user.role === "admin";
      if (!isCustomer && !isProvider && !isAdmin) {
        return { error: "You cannot cancel this booking." };
      }

      setLoading(true);
      await simulateDelay(500);
      clearScheduledResponse(bookingId);

      const cancelledBy = isAdmin ? "admin" : isProvider ? "provider" : "customer";
      const result = cancelBookingRecord(db, bookingId, cancelledBy);
      if (result.error) {
        setLoading(false);
        return { error: result.error };
      }

      let next = result.db;
      const refundNote =
        booking.paymentStatus === "authorized" ? " Payment refunded." : "";
      next = appendNotification(next, booking.customerId, {
        type: "booking",
        title: "Booking cancelled",
        message: `Your ${booking.service} booking on ${booking.date} was cancelled.${refundNote}`,
        href: "/customer/dashboard",
      });
      if (provider) {
        next = appendNotification(next, provider.userId, {
          type: "booking",
          title: "Booking cancelled",
          message: `${booking.customerName}'s ${booking.service} booking was cancelled.`,
          href: "/provider/dashboard",
        });
      }

      persist(next);
      emitSystemEvent({
        type: "booking_cancelled",
        message: `${booking.service} booking cancelled`,
      });
      setLoading(false);
      return {};
    },
    [db, user, persist, clearScheduledResponse, appendNotification, emitSystemEvent]
  );

  const respondToBooking = useCallback(
    async (bookingId: string, accepted: boolean) => {
      if (!db || !user) return { error: "You must be logged in." };
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: "Booking not found." };
      if (booking.status !== "pending") {
        return { error: "This request was already handled." };
      }

      const provider = db.providers.find((p) => p.id === booking.providerId);
      if (!provider || provider.userId !== user.id) {
        return { error: "Only the assigned provider can respond." };
      }

      setLoading(true);
      await simulateDelay(400);
      clearScheduledResponse(bookingId);

      let next = resolveBookingRecord(db, bookingId, accepted);
      if (accepted) {
        next = notifyBookingParties(
          next,
          { ...booking, status: "confirmed", paymentStatus: "authorized" },
          {
            type: "booking",
            title: "Booking confirmed",
            message: `${provider.name} accepted your ${booking.service} request.`,
            href: "/customer/dashboard",
          },
          user.id,
          {
            type: "booking",
            title: "You accepted a job",
            message: `${booking.customerName}'s ${booking.service} booking is confirmed.`,
            href: "/provider/dashboard",
          }
        );
        emitSystemEvent({
          type: "booking_accepted",
          message: `${provider.name} accepted a booking`,
        });
      } else {
        next = appendNotification(next, booking.customerId, {
          type: "booking",
          title: "Booking declined",
          message: `${provider.name} declined your ${booking.service} request.`,
          href: "/customer/dashboard",
        });
        emitSystemEvent({
          type: "booking_declined",
          message: `${provider.name} declined a request`,
        });
      }

      persist(next);
      setLoading(false);
      return {};
    },
    [
      db,
      user,
      persist,
      clearScheduledResponse,
      notifyBookingParties,
      appendNotification,
      emitSystemEvent,
    ]
  );

  const reportProvider = useCallback(
    async (input: {
      providerId: string;
      bookingId?: string;
      reason: string;
      details: string;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (!input.reason.trim()) return { error: "Please select a reason." };

      setLoading(true);
      await simulateDelay(500);
      const reportId = newId("report");
      const result = submitReportRecord(
        db,
        { ...input, reporterId: user.id },
        reportId
      );
      if (result.error) {
        setLoading(false);
        return { error: result.error };
      }

      const provider = db.providers.find((p) => p.id === input.providerId);
      let next = result.db;
      const admin = db.users.find((u) => u.role === "admin");
      if (admin) {
        next = appendNotification(next, admin.id, {
          type: "report",
          title: "New safety report",
          message: `${user.name} reported ${provider?.name ?? "a provider"}: ${input.reason}`,
          href: "/admin",
        });
      }
      persist(next);
      emitSystemEvent({
        type: "report",
        message: "New provider report submitted",
      });
      setLoading(false);
      return {};
    },
    [db, user, persist, appendNotification, emitSystemEvent]
  );

  const resolveReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      setLoading(true);
      await simulateDelay(300);
      persist(resolveReportRecord(db, reportId));
      setLoading(false);
    },
    [db, persist]
  );

  const dismissReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      setLoading(true);
      await simulateDelay(300);
      persist(dismissReportRecord(db, reportId));
      setLoading(false);
    },
    [db, persist]
  );

  const banProviderFromReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      const report = db.reports.find((r) => r.id === reportId);
      if (!report) return;
      const provider = db.providers.find((p) => p.id === report.providerId);
      if (!provider) return;
      setLoading(true);
      await simulateDelay(400);
      let next = banUserRecord(db, provider.userId, true);
      next = resolveReportRecord(next, reportId);
      persist(next);
      emitSystemEvent({
        type: "report",
        message: `${provider.name} banned after report review`,
      });
      setLoading(false);
    },
    [db, persist, emitSystemEvent]
  );

  const getNotifications = useCallback(() => {
    if (!db || !user) return [];
    return (db.notifications ?? [])
      .filter((n) => n.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [db, user]);

  const unreadNotificationCount = useMemo(() => {
    if (!db || !user) return 0;
    return (db.notifications ?? []).filter((n) => n.userId === user.id && !n.read)
      .length;
  }, [db, user]);

  const markNotificationsRead = useCallback(
    (ids?: string[]) => {
      if (!db || !user) return;
      persist(markNotificationsReadRecord(db, user.id, ids));
    },
    [db, user, persist]
  );

  const getAnalytics = useCallback(() => {
    if (!db) {
      return {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        declinedBookings: 0,
        acceptanceRate: 0,
        completionRate: 0,
        cancellationRate: 0,
        estimatedGmv: 0,
        avgBookingValue: 0,
        openReports: 0,
        bookingsLast7Days: 0,
        activeJobs: 0,
        popularServices: [],
        topProviders: [],
        bookingsPerDay: [],
      };
    }
    return getMarketplaceAnalytics(db);
  }, [db]);

  const toggleBlockedSlot = useCallback(
    async (date: string, time: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      setLoading(true);
      await simulateDelay(300);
      const result = toggleProviderBlockedSlotRecord(db, user.id, date, time);
      if (result.error) {
        setLoading(false);
        return { error: result.error };
      }
      persist(result.db);
      setLoading(false);
      return {};
    },
    [db, user, persist]
  );

  const getAvailabilityHint = useCallback(
    (providerId: string) => {
      if (!db) return "Loading availability…";
      const provider = db.providers.find((p) => p.id === providerId);
      if (!provider) return "Provider not found.";
      return getAvailabilityHintForProvider(db, provider);
    },
    [db]
  );

  const getRebookPrefill = useCallback(
    (providerId: string): Partial<MockBooking> | null => {
      if (!db || !user) return null;
      const past = db.bookings
        .filter(
          (b) =>
            b.customerId === user.id &&
            b.providerId === providerId &&
            ["completed", "confirmed", "cancelled", "declined"].includes(b.status)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      if (!past) return null;
      const next = getNextAvailableSlot(db, providerId);
      return {
        service: past.service,
        hours: past.hours,
        date: next?.date,
        time: next?.time,
      };
    },
    [db, user]
  );

  const addReview = useCallback(
    async (input: {
      providerId: string;
      bookingId?: string;
      rating: number;
      comment: string;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (!input.rating) return { error: "Please select a rating." };
      const validationError = validateReview(db, {
        customerId: user.id,
        bookingId: input.bookingId,
      });
      if (validationError) {
        return { error: validationError };
      }
      await simulateDelay(DEMO_MODE ? 250 : 600);
      const id = newId("review");
      const next = addReviewRecord(
        db,
        { ...input, customerId: user.id },
        id
      );
      persist(next);
      return {};
    },
    [db, user, persist]
  );

  const updateProvider = useCallback(
    async (patch: {
      services?: string[];
      pricingType?: MockProvider["pricingType"];
      price?: number;
      basePrice?: number;
      hourlyRate?: number;
      servicePackages?: MockProvider["servicePackages"];
      location?: string;
      description?: string;
      availability?: string;
      availableToday?: boolean;
      availableTomorrow?: boolean;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      setLoading(true);
      await simulateDelay();
      const next = updateProviderRecord(db, user.id, patch);
      persist(next);
      setLoading(false);
      return {};
    },
    [db, user, persist]
  );

  const approveProvider = useCallback(
    async (providerId: string, approved: boolean) => {
      if (!db) return;
      const provider = db.providers.find((p) => p.id === providerId);
      setLoading(true);
      await simulateDelay(400);
      persist(approveProviderRecord(db, providerId, approved));
      if (provider && approved) {
        emitSystemEvent({
          type: "booking_accepted",
          message: `Provider approved: ${provider.name} — now visible in search`,
        });
      }
      setLoading(false);
    },
    [db, persist, emitSystemEvent]
  );

  const rejectProvider = useCallback(
    async (providerId: string) => {
      if (!db) return;
      const provider = db.providers.find((p) => p.id === providerId);
      setLoading(true);
      await simulateDelay(400);
      persist(rejectProviderRecord(db, providerId));
      if (provider) {
        emitSystemEvent({
          type: "booking_declined",
          message: `Provider rejected: ${provider.name}`,
        });
      }
      setLoading(false);
    },
    [db, persist, emitSystemEvent]
  );

  const banUser = useCallback(
    async (userId: string, banned: boolean) => {
      if (!db) return;
      const account = db.users.find((u) => u.id === userId);
      setLoading(true);
      await simulateDelay(400);
      persist(banUserRecord(db, userId, banned));
      if (account && banned) {
        emitSystemEvent({
          type: "report",
          message: `User banned: ${account.name}`,
        });
      }
      setLoading(false);
    },
    [db, persist, emitSystemEvent]
  );

  const filterProviders = useCallback(
    (filters: ProviderFilters) => {
      if (!db) {
        return {
          list: [],
          total: 0,
          page: 1,
          pageSize: DEMO_PROVIDER_PAGE_SIZE,
          totalPages: 1,
          topRanked: [],
          topRankMap: {},
          recommendationMap: {},
          bestMatchId: undefined,
          urgent: false,
        };
      }
      const cacheKey = JSON.stringify(filters);
      const cached = filterCacheRef.current;
      if (cached?.db === db && cached.key === cacheKey) {
        return cached.result;
      }

      const effectiveStatus =
        filters.status === "all" ? "all" : filters.status ?? "verified";
      const result = filterMockProviders(db, {
        ...filters,
        status: effectiveStatus,
      });
      const topRanked = getTopRankedProviders(db, {
        ...filters,
        status: "verified",
      });
      const urgent = detectUrgency(filters.q ?? "");
      const pageLegacy = result.list.map(mockProviderToLegacy);
      const labels = assignRecommendationLabels(
        rankProviders(pageLegacy, filters.service, urgent).slice(0, 3)
      );
      const recommendationMap = Object.fromEntries(labels.entries()) as Record<
        string,
        RecommendationLabel
      >;
      const bestMatchId = topRanked[0]?.id;

      const value = {
        ...result,
        topRanked,
        topRankMap: Object.fromEntries(topRanked.map((p, i) => [p.id, i + 1])),
        recommendationMap,
        bestMatchId,
        urgent,
      };
      filterCacheRef.current = { db, key: cacheKey, result: value };
      return value;
    },
    [db]
  );

  const trackProviderViewFn = useCallback(
    (providerId: string) => {
      trackRecentProvider(providerId);
    },
    []
  );

  const trackProviderClickFn = useCallback((providerId: string) => {
    incrementProviderClick(providerId);
  }, []);

  const isFavorite = useCallback(
    (providerId: string) => favoriteIds.includes(providerId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((providerId: string) => {
    const nowSaved = !favoriteIds.includes(providerId);
    const next = nowSaved
      ? [...favoriteIds, providerId]
      : favoriteIds.filter((id) => id !== providerId);
    saveFavoriteIds(next);
    setFavoriteIds(next);
    return nowSaved;
  }, [favoriteIds]);

  const getSavedProviders = useCallback(() => {
    if (!db) return [];
    return favoriteIds
      .map((id) => db.providers.find((p) => p.id === id))
      .filter((p): p is MockProvider => Boolean(p));
  }, [db, favoriteIds]);

  const getRecentlyViewedProviders = useCallback(() => {
    if (!db) return [];
    return loadRecentProviderIds()
      .map((id) => db.providers.find((p) => p.id === id))
      .filter((p): p is MockProvider => Boolean(p))
      .slice(0, 6);
  }, [db]);

  const getProvider = useCallback(
    (id: string) => db?.providers.find((p) => p.id === id),
    [db]
  );

  const getProviderReviews = useCallback(
    (providerId: string) => (db ? getReviewsForProvider(db, providerId) : []),
    [db]
  );

  const getProviderForUser = useCallback(
    (userId: string) => db?.providers.find((p) => p.userId === userId),
    [db]
  );

  const getBookingsForCustomer = useCallback(
    (customerId: string) =>
      db?.bookings.filter((b) => b.customerId === customerId) ?? [],
    [db]
  );

  const getBookingsForProvider = useCallback(
    (providerId: string) =>
      db?.bookings.filter((b) => b.providerId === providerId) ?? [],
    [db]
  );

  const getStatsFn = useCallback(() => {
    if (!db) {
      return {
        totalUsers: 0,
        totalProviders: 0,
        verifiedProviders: 0,
        pendingProviders: 0,
        totalBookings: 0,
        activeJobs: 0,
        jobsCompleted: 0,
        avgRating: 0,
      };
    }
    return getStats(db);
  }, [db]);

  const assist = useCallback(
    (message: string) => {
      const context = parseAssistantContext(message);
      const intent = resolveIntentFast(message);
      if (!db) {
        return { message: intent.reply, chips: [], providers: [] };
      }
      const matched = filterMockProviders(db, {
        service: context.service ?? intent.service,
        status: "verified",
        availability:
          context.urgency === "today"
            ? "today"
            : context.urgency === "tomorrow"
              ? "tomorrow"
              : undefined,
        maxPrice: context.maxPrice ? String(context.maxPrice) : undefined,
        sort: context.sort,
      });
      const top = matched.list.slice(0, 3);
      const labels = assignRecommendationLabels(top.map(mockProviderToLegacy));
      const chips: string[] = [];
      if (context.service) chips.push(context.service);
      if (context.maxPrice) chips.push(`Under $${context.maxPrice}/hr`);
      if (context.urgency === "today") chips.push("Available today");
      if (context.sort === "price") chips.push("Budget-friendly");
      let reply = intent.reply;
      if (chips.length) reply += `\n\nLooking for: ${chips.join(" · ")}`;
      return {
        message: reply,
        service: context.service ?? intent.service,
        chips,
        providers: top.map((p) =>
          toProviderCardData(mockProviderToLegacy(p), {
            recommendationLabel: labels.get(p.id),
          })
        ),
      };
    },
    [db]
  );

  const parseSearch = useCallback((query: string) => {
    const filters = parseSearchFallback(query);
    const params = new URLSearchParams();
    if (filters.service) params.set("service", filters.service);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    if (filters.maxDistance) params.set("maxDistance", String(filters.maxDistance));
    if (filters.availability) params.set("availability", filters.availability);
    if (query.trim()) params.set("q", query.trim());
    return {
      service: filters.service,
      sort: filters.sort,
      minPrice: filters.minPrice ? String(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? String(filters.maxPrice) : undefined,
      minRating: filters.minRating ? String(filters.minRating) : undefined,
      maxDistance: filters.maxDistance ? String(filters.maxDistance) : undefined,
      availability: filters.availability,
      q: query.trim() || undefined,
      redirectParams: params,
    };
  }, []);

  const value: MockAppContextValue = {
    ready,
    db,
    session,
    user,
    loading,
    login,
    register,
    demoLogin,
    logout,
    createBooking,
    completeBooking,
    getAvailableSlots,
    sendChatMessage,
    getChatMessages,
    removeReview,
    cancelBooking,
    respondToBooking,
    reportProvider,
    resolveReport,
    dismissReport,
    banProviderFromReport,
    getNotifications,
    unreadNotificationCount,
    markNotificationsRead,
    getAnalytics,
    toggleBlockedSlot,
    getAvailabilityHint,
    getRebookPrefill,
    systemEvents,
    addReview,
    updateProvider,
    approveProvider,
    rejectProvider,
    banUser,
    filterProviders,
    getProvider,
    trackProviderView: trackProviderViewFn,
    trackProviderClick: trackProviderClickFn,
    isFavorite,
    toggleFavorite,
    getSavedProviders,
    getRecentlyViewedProviders,
    getProviderReviews,
    getProviderForUser,
    getBookingsForCustomer,
    getBookingsForProvider,
    getStats: getStatsFn,
    assist,
    parseSearch,
  };

  return (
    <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>
  );
}

export function useMockApp() {
  const ctx = useContext(MockAppContext);
  if (!ctx) {
    throw new Error("useMockApp must be used within MockAppProvider");
  }
  return ctx;
}

export { DEMO_PASSWORD as DEFAULT_DEMO_PASSWORD };
