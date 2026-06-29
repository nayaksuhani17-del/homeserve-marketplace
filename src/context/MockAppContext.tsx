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
import { loadDb, saveDb, MOCK_DB_UPDATED_EVENT } from "@/lib/mock/load-db";
import {
  addReviewRecord,
  addNotificationRecord,
  approveProviderRecord,
  updateUserRoleRecord,
  updateUserAddressRecord,
  updateUserProfileRecord,
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
  deleteUserRecord,
  actionDelay,
  submitReportRecord,
  toggleProviderBlockedSlotRecord,
  updateProviderRecord,
  validateReview,
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
} from "@/lib/mock/operations";
import { getMarketplaceAnalytics } from "@/lib/mock/analytics";
import {
  appendMessage,
  getConversationMessages,
  migrateDirectMessages,
  MESSAGES_UPDATED_EVENT,
  removeMessagesForUser,
  type StoredMessage,
} from "@/lib/messages/store";
import { listConversationsForUser, type ConversationPreview } from "@/lib/messages/conversations";
import { publicDisplayName, validateRegistrationProfile } from "@/lib/user-profile";
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
  MOCK_DB_VERSION,
  MOCK_SESSION_COOKIE,
  MOCK_SESSION_KEY,
} from "@/lib/mock/types";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import { BRAND_WELCOME, BRAND_WELCOME_PRO } from "@/lib/brand";
import {
  DEMO_MODE,
  DEMO_PROVIDER_PAGE_SIZE,
  DEMO_ROLE_REDIRECT,
  MANUAL_BOOKING_FLOW,
} from "@/lib/demo/mode";
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
  getAvailableDates as getAvailableDatesForProvider,
  getChatReplyDelayMs,
  getNextAvailableSlot,
  getResponseDelayMs,
  getResponseSpeed,
  providerHasAutoReply,
  shouldAcceptBooking,
} from "@/lib/mock/simulation";
import {
  incrementProviderClick,
  loadFavoriteIds,
  loadRecentProviderIds,
  saveFavoriteIds,
  purgeProvidersFromLocalCaches,
  trackRecentProvider,
} from "@/lib/smart";
import type { RecommendationLabel } from "@/lib/recommendations";
import { customerBookingsHref, customerMessagesHref, messageNotificationHref, providerDashboardHref } from "@/lib/notification-links";
import { advancedSearch, type UnifiedSearchResult } from "@/lib/search/unified";
import {
  dashboardPathForMode,
  defaultModeForUser,
  hasCustomerRole,
  hasProviderRole,
  isAdmin,
  resolveActiveMode,
  sessionForUser,
} from "@/lib/user-capabilities";
import {
  resolveCustomerAddress,
  resolveMaxDistance,
  loadCustomerLocation,
  enrichCustomerLocation,
  locationMatchingKey,
  parseLocationInput,
  saveCustomerLocation,
} from "@/lib/location";
import type { AppMode } from "@/lib/mock/types";
import {
  capabilitySummary,
  dashboardPathForRole,
  isDemoAccount,
  roleLabel,
  roleBadgeClass,
  type AccountSummary,
} from "@/lib/accounts";

export const SYSTEM_EVENT = "homeserve-system-event";

export type SignupRoles = {
  customerRole: boolean;
  providerRole: boolean;
};

export type { RegistrationProfileInput } from "@/lib/user-profile";

type MockAppContextValue = {
  ready: boolean;
  db: MockDatabase | null;
  /** Bumps when shared store is persisted — use to refresh booking/notification views. */
  dbRevision: number;
  session: MockSession | null;
  user: MockUser | null;
  /** Active customer/provider hat for dual-role accounts. */
  activeMode: AppMode | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<{ error?: string; redirect?: string }>;
  register: (
    profile: import("@/lib/user-profile").RegistrationProfileInput,
    roles: SignupRoles
  ) => Promise<{ error?: string; redirect?: string }>;
  demoLogin: (
    role: "customer" | "provider" | "admin",
    redirectTo?: string
  ) => Promise<{ error?: string; redirect?: string }>;
  listAccounts: () => import("@/lib/accounts").AccountSummary[];
  switchAccount: (userId: string) => Promise<{ error?: string; redirect?: string }>;
  switchMode: (mode: AppMode) => Promise<{ error?: string; redirect?: string }>;
  enableProviderRole: () => Promise<{ error?: string; redirect?: string }>;
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
  getAvailableDates: (providerId: string, maxDays?: number) => string[];
  sendChatMessage: (bookingId: string, text: string) => Promise<{ error?: string }>;
  getChatMessages: (bookingId: string) => MockDatabase["chatMessages"];
  getDirectMessages: (otherUserId: string) => StoredMessage[];
  listConversations: () => ConversationPreview[];
  sendDirectMessage: (receiverId: string, text: string) => Promise<{ error?: string }>;
  advancedSearch: (query: string) => UnifiedSearchResult[];
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
    bookingId: string;
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
    weeklySchedule?: MockProvider["weeklySchedule"];
    availabilityConfig?: MockProvider["availabilityConfig"];
    autoReplyEnabled?: boolean;
  }) => Promise<{ error?: string }>;
  updateUserProfile: (patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  }) => Promise<{ error?: string }>;
  approveProvider: (providerId: string, approved: boolean) => Promise<void>;
  rejectProvider: (providerId: string) => Promise<void>;
  banUser: (userId: string, banned: boolean) => Promise<{ error?: string }>;
  deleteUser: (userId: string) => Promise<{ error?: string }>;
  deleteMyAccount: () => Promise<{ error?: string }>;
  setUserRole: (
    userId: string,
    role: MockUser["role"]
  ) => Promise<{ error?: string }>;
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
  updateCustomerAddress: (address: string) => Promise<{ error?: string }>;
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

function syncSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  if (active) {
    document.cookie = `${MOCK_SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${MOCK_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function saveSession(session: MockSession | null) {
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    syncSessionCookie(true);
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
    syncSessionCookie(false);
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
  const [dbRevision, setDbRevision] = useState(0);
  const [messagesRevision, setMessagesRevision] = useState(0);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const responseTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resumedPending = useRef(new Set<string>());
  const saveDbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDbRef = useRef<MockDatabase | null>(null);
  const dbRef = useRef<MockDatabase | null>(null);
  const filterCacheRef = useRef<{
    db: MockDatabase;
    key: string;
    result: ReturnType<MockAppContextValue["filterProviders"]>;
  } | null>(null);

  const bumpMessagesRevision = useCallback(() => {
    setMessagesRevision((r) => r + 1);
  }, []);

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
                title: "Booking accepted",
                message: "Your booking has been accepted ✅",
                href: customerBookingsHref("upcoming"),
              },
              providerAccount?.id,
              {
                type: "booking",
                title: "Job confirmed",
                message: `You accepted ${current.customerName}'s booking.`,
                href: providerDashboardHref("upcoming"),
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
                    href: customerBookingsHref("past"),
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
              message: "Your booking was declined ❌",
              href: customerBookingsHref("past"),
            });
            emitSystemEvent({
              type: "booking_declined",
              message: `${current.providerName} declined a booking request`,
            });
          }

          saveDb(next);
          setDbRevision((r) => r + 1);

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
      dbRef.current = stored;
      setDb(stored);
      const resolvedSession =
        nextSession && stored.users.find((u) => u.id === nextSession.userId)
          ? sessionForUser(
              stored.users.find((u) => u.id === nextSession.userId)!,
              nextSession
            )
          : nextSession;
      setSession(resolvedSession);
      if (resolvedSession) saveSession(resolvedSession);
      syncSessionCookie(Boolean(nextSession));
      setFavoriteIds(loadFavoriteIds());
      migrateDirectMessages(stored.directMessages ?? []);
      setMessagesRevision((r) => r + 1);
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
    if (!ready || !db || MANUAL_BOOKING_FLOW) return;
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

  const flushPendingSave = useCallback(() => {
    if (saveDbTimerRef.current) {
      clearTimeout(saveDbTimerRef.current);
      saveDbTimerRef.current = null;
    }
    if (pendingDbRef.current) {
      saveDb(pendingDbRef.current);
      pendingDbRef.current = null;
    }
  }, []);

  const discardPendingSave = useCallback(() => {
    if (saveDbTimerRef.current) {
      clearTimeout(saveDbTimerRef.current);
      saveDbTimerRef.current = null;
    }
    pendingDbRef.current = null;
  }, []);

  const applyDb = useCallback((next: MockDatabase, bumpRevision = true) => {
    const normalized = normalizeMockDatabase(next);
    filterCacheRef.current = null;
    dbRef.current = normalized;
    setDb(normalized);
    if (bumpRevision) setDbRevision((r) => r + 1);
    return normalized;
  }, []);

  const persistImmediate = useCallback(
    (next: MockDatabase) => {
      discardPendingSave();
      const normalized = applyDb(next);
      saveDb(normalized);
    },
    [discardPendingSave, applyDb]
  );

  /** Write in-memory DB to disk before account switch / login reload. */
  const getSharedDb = useCallback((): MockDatabase | null => {
    flushPendingSave();
    const fromDisk = loadDb();
    if (fromDisk) return fromDisk;
    return dbRef.current ? normalizeMockDatabase(dbRef.current) : null;
  }, [flushPendingSave]);

  const syncDbBeforeSwitch = useCallback((): MockDatabase | null => {
    return getSharedDb();
  }, [getSharedDb]);

  const reloadFromStorage = useCallback(() => {
    const fresh = getSharedDb();
    if (fresh) applyDb(fresh);
    return fresh;
  }, [getSharedDb, applyDb]);

  const persist = useCallback(
    (next: MockDatabase) => {
      persistImmediate(next);
    },
    [persistImmediate]
  );

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== MOCK_DB_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as MockDatabase;
        if (parsed.version !== MOCK_DB_VERSION) return;
        applyDb(parsed);
      } catch {
        /* ignore corrupt storage */
      }
    }
    function onDbUpdated(e: Event) {
      const detail = (e as CustomEvent<MockDatabase>).detail;
      if (!detail || detail.version !== MOCK_DB_VERSION) return;
      applyDb(detail);
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(MOCK_DB_UPDATED_EVENT, onDbUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MOCK_DB_UPDATED_EVENT, onDbUpdated);
    };
  }, [applyDb]);

  const user = useMemo(() => {
    if (!db || !session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }, [db, session]);

  const activeMode = useMemo(
    () => resolveActiveMode(user, session),
    [user, session]
  );

  useEffect(() => {
    if (!ready || !session) return;
    reloadFromStorage();
    if (dbRef.current) {
      migrateDirectMessages(dbRef.current.directMessages ?? []);
    }
    bumpMessagesRevision();
    // Only re-sync when the active account changes — not when db state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadFromStorage is stable; db must not retrigger this
  }, [session?.userId, ready]);

  useEffect(() => {
    function onMessagesUpdated() {
      bumpMessagesRevision();
    }
    window.addEventListener(MESSAGES_UPDATED_EVENT, onMessagesUpdated);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, onMessagesUpdated);
  }, [bumpMessagesRevision]);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const source = syncDbBeforeSwitch();
      if (!source) return { error: "App not ready" };
      const found = source.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found) {
        return { error: "No account found with that email." };
      }
      if (found.banned) {
        return { error: "Your account has been banned." };
      }
      if (found.password !== password) {
        return { error: "Incorrect password." };
      }
      applyDb(source);
      const sess = sessionForUser(found, loadSession());
      setSession(sess);
      saveSession(sess);
      if (redirectTo) return { redirect: redirectTo };
      if (isAdmin(found)) return { redirect: "/admin" };
      return { redirect: dashboardPathForMode(sess.activeMode ?? defaultModeForUser(found)) };
    },
    [syncDbBeforeSwitch, applyDb]
  );

  const register = useCallback(
    async (
      profile: import("@/lib/user-profile").RegistrationProfileInput,
      roles: SignupRoles
    ) => {
      if (!db) return { error: "App not ready" };
      if (!roles.customerRole && !roles.providerRole) {
        return { error: "Choose at least one role: customer, provider, or both." };
      }
      const validationError = validateRegistrationProfile(profile);
      if (validationError) return { error: validationError };
      const { firstName, lastName, email, phoneNumber, address, password } = profile;
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: "An account with this email already exists." };
      }
      const guest = newGuestUser({
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        password,
        ...roles,
      });
      const provider = roles.providerRole ? newGuestProvider(guest) : undefined;
      const registered = registerUserRecord(db, guest, provider);
      if (registered.error) {
        return { error: registered.error };
      }
      let next = registered.db;
      const both = roles.customerRole && roles.providerRole;
      next = appendNotification(next, guest.id, {
        type: "system",
        title: both
          ? BRAND_WELCOME
          : roles.providerRole
            ? BRAND_WELCOME_PRO
            : BRAND_WELCOME,
        message: both
          ? "Your account can book services and receive job requests. Switch modes anytime from the header."
          : roles.providerRole
            ? "Your provider dashboard is ready. Complete your profile while admin verifies your account."
            : "Your account is ready. Search for a service and book a local professional in minutes.",
        href: roles.providerRole && !roles.customerRole
          ? "/provider/dashboard"
          : "/customer/dashboard",
      });
      persistImmediate(next);
      const sess = sessionForUser(guest);
      setSession(sess);
      saveSession(sess);
      return { redirect: dashboardPathForMode(sess.activeMode ?? defaultModeForUser(guest)) };
    },
    [db, persistImmediate, appendNotification]
  );

  const listAccounts = useCallback((): AccountSummary[] => {
    if (!db) return [];
    return [...db.users]
      .filter((u) => !u.banned)
      .sort((a, b) => {
        const aDemo = isDemoAccount(a);
        const bDemo = isDemoAccount(b);
        if (aDemo !== bDemo) return aDemo ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        capabilities: capabilitySummary(u),
        isDemo: isDemoAccount(u),
        isActive: session?.userId === u.id,
      }));
  }, [db, session]);

  const switchAccount = useCallback(
    async (userId: string) => {
      const source = syncDbBeforeSwitch();
      if (!source) return { error: "App not ready" };
      const found = source.users.find((u) => u.id === userId);
      if (!found || found.banned) return { error: "Account not found." };
      applyDb(source);
      const sess = sessionForUser(found);
      setSession(sess);
      saveSession(sess);
      if (isAdmin(found)) return { redirect: "/admin" };
      return { redirect: dashboardPathForMode(sess.activeMode ?? defaultModeForUser(found)) };
    },
    [syncDbBeforeSwitch, applyDb]
  );

  const switchMode = useCallback(
    async (mode: AppMode) => {
      if (!user || !session) return { error: "Not signed in." };
      if (mode === "customer" && !hasCustomerRole(user)) {
        return { error: "Customer mode is not enabled on this account." };
      }
      if (mode === "provider" && !hasProviderRole(user)) {
        return { error: "Provider mode is not enabled on this account." };
      }
      if (mode === "provider" && !db?.providers.some((p) => p.userId === user.id)) {
        return { error: "Complete provider profile setup first." };
      }
      reloadFromStorage();
      const sess: MockSession = { ...session, activeMode: mode };
      setSession(sess);
      saveSession(sess);
      return { redirect: dashboardPathForMode(mode) };
    },
    [user, session, db, reloadFromStorage]
  );

  const enableProviderRole = useCallback(async () => {
    if (!db || !user) return { error: "You must be logged in." };
    if (!hasCustomerRole(user)) {
      return { error: "This action is only available for customer accounts." };
    }
    if (hasProviderRole(user)) {
      const sess = sessionForUser(
        user,
        session ?? { userId: user.id, activeMode: "provider" }
      );
      sess.activeMode = "provider";
      setSession(sess);
      saveSession(sess);
      return { redirect: "/provider/dashboard" };
    }
    const updatedUser: MockUser = {
      ...user,
      providerRole: true,
      role: user.customerRole ? "customer" : "provider",
    };
    const provider = newGuestProvider(updatedUser);
    let next: MockDatabase = {
      ...db,
      users: db.users.map((u) => (u.id === user.id ? updatedUser : u)),
      providers: [...db.providers.filter((p) => p.userId !== user.id), provider],
    };
    next = appendNotification(next, user.id, {
      type: "system",
      title: BRAND_WELCOME_PRO,
      message:
        "Your provider profile is ready. Switch to Provider mode and complete your services and availability.",
      href: "/provider/dashboard",
    });
    persistImmediate(next);
    const sess: MockSession = { userId: user.id, activeMode: "provider" };
    setSession(sess);
    saveSession(sess);
    return { redirect: "/provider/dashboard" };
  }, [db, user, session, persistImmediate, appendNotification]);

  const demoLogin = useCallback(
    async (role: "customer" | "provider" | "admin", redirectTo?: string) => {
      const source = syncDbBeforeSwitch();
      if (!source) return { error: "App not ready" };
      const email = DEMO_ROLE_EMAIL[role];
      const found = source.users.find((u) => u.email === email);
      if (!found) return { error: "Demo user not found." };
      applyDb(source);
      const sess = sessionForUser(found);
      setSession(sess);
      saveSession(sess);
      return { redirect: redirectTo ?? DEMO_ROLE_REDIRECT[role] };
    },
    [syncDbBeforeSwitch, applyDb]
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
      if (!hasCustomerRole(user)) {
        return {
          error: "Enable customer mode on your account to book services.",
        };
      }
      if (activeMode !== "customer") {
        return {
          error: "Switch to Customer mode to book services.",
        };
      }
      if (user.banned) {
        return { error: "Your account has been suspended." };
      }
      if (!input.service.trim() || !input.date.trim()) {
        return { error: "Please fill all fields." };
      }
      if (!input.time) {
        return { error: "Please select an available time slot." };
      }
      await actionDelay(350);
      const provider = db.providers.find((p) => p.id === input.providerId);
      if (!provider) {
        return { error: "Provider not found." };
      }
      if (provider.rejected) {
        return { error: "This provider is no longer accepting bookings." };
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
      if (!MANUAL_BOOKING_FLOW) {
        resumedPending.current.add(id);
        scheduleBookingResponse(id, result.db);
      }

      const providerAccount = result.db.users.find((u) => u.id === provider.userId);
      let next = appendNotification(result.db, user.id, {
        type: "booking",
        title: "Request sent",
        message: `Waiting for ${provider.name} to respond to your ${input.service} request.`,
        href: customerBookingsHref("upcoming"),
      });
      if (providerAccount) {
        next = appendNotification(next, providerAccount.id, {
          type: "booking",
          title: "New job request received",
          message: `${user.name} requested ${input.service} on ${input.date}${input.time ? ` at ${input.time}` : ""}.`,
          href: providerDashboardHref("requests"),
        });
      }
      persistImmediate(next);

      emitSystemEvent({
        type: "booking_created",
        message: "New booking in your area",
      });
      return { booking: result.db.bookings.find((b) => b.id === id) };
    },
    [db, user, persistImmediate, scheduleBookingResponse, emitSystemEvent, appendNotification]
  );

  const completeBooking = useCallback(
    async (bookingId: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: "Booking not found." };
      if (booking.status !== "confirmed") {
        return { error: "Only confirmed jobs can be marked complete." };
      }
      const provider = db.providers.find((p) => p.id === booking.providerId);
      if (!provider || provider.userId !== user.id) {
        return { error: "Only the assigned provider can complete this job." };
      }
      let next = completeBookingRecord(db, bookingId);
      next = appendNotification(next, booking.customerId, {
        type: "payment",
        title: "Job complete",
        message: `${booking.providerName} marked your ${booking.service} job complete. Payment released.`,
        href: customerBookingsHref("past"),
      });
      persistImmediate(next);
      emitSystemEvent({
        type: "job_completed",
        message: `${booking.service} job marked complete`,
      });
      emitSystemEvent({
        type: "payment",
        message: `Payment released for ${booking.customerName}`,
      });
      return {};
    },
    [db, user, persistImmediate, emitSystemEvent, appendNotification]
  );

  const getAvailableSlots = useCallback(
    (providerId: string, date: string) => {
      if (!db) return [];
      return getAvailableSlotsForProvider(db, providerId, date);
    },
    [db]
  );

  const getAvailableDates = useCallback(
    (providerId: string, maxDays = 14) => {
      if (!db) return [];
      return getAvailableDatesForProvider(db, providerId, maxDays);
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
    [db, dbRevision]
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
        providerRecord?.id === booking.providerId &&
        hasProviderRole(user) &&
        activeMode === "provider"
          ? "provider"
          : booking.customerId === user.id &&
              hasCustomerRole(user) &&
              activeMode === "customer"
            ? "customer"
            : null;
      if (!senderRole) return { error: "You cannot message on this booking." };

      await actionDelay(300);

      const next = addChatMessageRecord(db, {
        id: newId("chat"),
        bookingId,
        senderRole,
        senderName: user.name,
        text,
      });
      persistImmediate(next);

      const provider = db.providers.find((p) => p.id === booking.providerId);
      if (senderRole === "customer" && providerHasAutoReply(provider)) {
        const replyDelay = getChatReplyDelayMs();
        setTimeout(() => {
          const source = getSharedDb();
          if (!source) return;
          const reply = generateProviderChatReply(text);
          const withReply = addChatMessageRecord(source, {
            id: newId("chat"),
            bookingId,
            senderRole: "provider",
            senderName: booking.providerName,
            text: reply,
          });
          persistImmediate(withReply);
        }, replyDelay);
      }

      return {};
    },
    [db, user, persistImmediate, getSharedDb]
  );

  const getDirectMessages = useCallback(
    (otherUserId: string) => {
      if (!user) return [];
      const other = db?.users.find((u) => u.id === otherUserId);
      if (!other || other.banned) return [];
      return getConversationMessages(user.id, otherUserId);
    },
    [db, user, messagesRevision]
  );

  const listConversations = useCallback((): ConversationPreview[] => {
    if (!user || !db) return [];
    return listConversationsForUser(
      user.id,
      db.users.map((u) => ({
        id: u.id,
        name: publicDisplayName(u),
        banned: u.banned,
      }))
    );
  }, [user, db, messagesRevision]);

  const sendDirectMessage = useCallback(
    async (receiverId: string, text: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (user.id === receiverId) return { error: "You cannot message yourself." };
      const receiver = db.users.find((u) => u.id === receiverId);
      if (!receiver) return { error: "This user is no longer available." };
      if (receiver.banned) return { error: "This user is not available." };

      await actionDelay(300);

      appendMessage({
        sender_id: user.id,
        receiver_id: receiverId,
        text,
      });
      bumpMessagesRevision();

      let next = appendNotification(db, receiverId, {
        type: "message",
        title: `New message from ${user.name}`,
        message: text.slice(0, 80) + (text.length > 80 ? "…" : ""),
        href: messageNotificationHref(receiver, user.id),
        senderId: user.id,
      });
      persistImmediate(next);

      const receiverProvider = db.providers.find((p) => p.userId === receiverId);
      if (
        receiverProvider &&
        hasCustomerRole(user) &&
        activeMode === "customer" &&
        providerHasAutoReply(receiverProvider)
      ) {
        const replyDelay = getChatReplyDelayMs();
        const customerId = user.id;
        setTimeout(() => {
          const reply = generateProviderChatReply(text);
          appendMessage({
            sender_id: receiverId,
            receiver_id: customerId,
            text: reply,
          });
          bumpMessagesRevision();
          const source = getSharedDb();
          if (!source) return;
          const customerAccount = source.users.find((u) => u.id === customerId);
          const withNotif = appendNotification(source, customerId, {
            type: "message",
            title: `New message from ${receiver.name}`,
            message: reply.slice(0, 100),
            href: customerAccount
              ? messageNotificationHref(customerAccount, receiverId)
              : customerMessagesHref(receiverId),
            senderId: receiverId,
          });
          persistImmediate(withNotif);
        }, replyDelay);
      }

      return {};
    },
    [
      db,
      user,
      activeMode,
      persistImmediate,
      appendNotification,
      bumpMessagesRevision,
      getSharedDb,
    ]
  );

  const advancedSearchFn = useCallback(
    (query: string) => {
      if (!db) return [];
      return advancedSearch(db, query);
    },
    [db]
  );

  const finalizeAccountDeletion = useCallback(
    (result: { db: MockDatabase; purgedProviderIds?: string[] }) => {
      persistImmediate(result.db);
      const validProviderIds = new Set(result.db.providers.map((p) => p.id));
      const staleFavorites = loadFavoriteIds().filter((id) => !validProviderIds.has(id));
      const staleRecent = loadRecentProviderIds().filter((id) => !validProviderIds.has(id));
      const toPurge = [
        ...new Set([
          ...(result.purgedProviderIds ?? []),
          ...staleFavorites,
          ...staleRecent,
        ]),
      ];
      if (toPurge.length) purgeProvidersFromLocalCaches(toPurge);
      setFavoriteIds(loadFavoriteIds().filter((id) => validProviderIds.has(id)));
      filterCacheRef.current = null;
    },
    [persistImmediate]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (user.role !== "admin") return { error: "Admin access required." };
      if (userId === user.id) {
        return { error: "You cannot delete your own account while logged in. Use Delete My Account or switch accounts first." };
      }

      const result = deleteUserRecord(db, userId, { forbidSelf: true, actorId: user.id });
      if (result.error) {
        return { error: result.error };
      }
      removeMessagesForUser(userId);
      bumpMessagesRevision();
      finalizeAccountDeletion(result);
      emitSystemEvent({ type: "report", message: "Account deleted permanently" });
      return {};
    },
    [db, user, finalizeAccountDeletion, emitSystemEvent, bumpMessagesRevision]
  );

  const deleteMyAccount = useCallback(async () => {
    if (!db || !user) return { error: "You must be logged in." };
    if (user.role === "admin" && db.users.filter((u) => u.role === "admin" && !u.banned).length <= 1) {
      return { error: "You are the last admin — promote another admin before deleting your account." };
    }

    const result = deleteUserRecord(db, user.id);
    if (result.error) {
      return { error: result.error };
    }
    removeMessagesForUser(user.id);
    bumpMessagesRevision();
    finalizeAccountDeletion(result);
    saveSession(null);
    setSession(null);
    return {};
  }, [db, user, finalizeAccountDeletion, bumpMessagesRevision]);

  const removeReview = useCallback(
    async (reviewId: string) => {
      if (!db) return;
      persistImmediate(removeReviewRecord(db, reviewId));
      emitSystemEvent({
        type: "report",
        message: "Review removed — provider rating updated",
      });
    },
    [db, persistImmediate, emitSystemEvent]
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

      clearScheduledResponse(bookingId);

      const cancelledBy = isAdmin ? "admin" : isProvider ? "provider" : "customer";
      const result = cancelBookingRecord(db, bookingId, cancelledBy);
      if (result.error) {
        return { error: result.error };
      }

      let next = result.db;
      const refundNote =
        booking.paymentStatus === "authorized" ? " Payment refunded." : "";
      next = appendNotification(next, booking.customerId, {
        type: "booking",
        title: "Booking cancelled",
        message: `Your ${booking.service} booking on ${booking.date} was cancelled.${refundNote}`,
        href: customerBookingsHref("past"),
      });
      if (provider) {
        next = appendNotification(next, provider.userId, {
          type: "booking",
          title: "Booking cancelled",
          message: `${booking.customerName}'s ${booking.service} booking was cancelled.`,
          href: providerDashboardHref("requests"),
        });
      }

      persistImmediate(next);
      emitSystemEvent({
        type: "booking_cancelled",
        message: `${booking.service} booking cancelled`,
      });
      return {};
    },
    [db, user, persistImmediate, clearScheduledResponse, appendNotification, emitSystemEvent]
  );

  const respondToBooking = useCallback(
    async (bookingId: string, accepted: boolean) => {
      if (!user) return { error: "You must be logged in." };

      clearScheduledResponse(bookingId);

      const source = getSharedDb();
      if (!source) {
        return { error: "App not ready." };
      }

      const booking = source.bookings.find((b) => b.id === bookingId);
      if (!booking) {
        return { error: "Booking not found." };
      }
      if (booking.status !== "pending") {
        return { error: "This request was already handled." };
      }

      const provider = source.providers.find((p) => p.id === booking.providerId);
      if (!provider || provider.userId !== user.id) {
        return { error: "Only the assigned provider can respond." };
      }

      let next = resolveBookingRecord(source, bookingId, accepted);
      if (accepted) {
        next = notifyBookingParties(
          next,
          { ...booking, status: "confirmed", paymentStatus: "authorized" },
          {
            type: "booking",
            title: "Booking accepted",
            message: "Your booking has been accepted ✅",
            href: customerBookingsHref("upcoming"),
          },
          user.id,
          {
            type: "booking",
            title: "Job confirmed",
            message: `You accepted ${booking.customerName}'s ${booking.service} booking.`,
            href: providerDashboardHref("upcoming"),
          }
        );
      } else {
        next = appendNotification(next, booking.customerId, {
          type: "booking",
          title: "Booking declined",
          message: "Your booking was declined ❌",
          href: customerBookingsHref("past"),
        });
      }

      persistImmediate(next);

      emitSystemEvent({
        type: accepted ? "booking_accepted" : "booking_declined",
        message: accepted
          ? `${provider.name} accepted a booking`
          : `${provider.name} declined a request`,
      });
      return {};
    },
    [
      user,
      clearScheduledResponse,
      getSharedDb,
      notifyBookingParties,
      appendNotification,
      persistImmediate,
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

      const reportId = newId("report");
      const result = submitReportRecord(
        db,
        { ...input, reporterId: user.id },
        reportId
      );
      if (result.error) {
        return { error: result.error };
      }

      const provider = db.providers.find((p) => p.id === input.providerId);
      let next = result.db;
      for (const admin of db.users.filter((u) => u.role === "admin" && !u.banned)) {
        next = appendNotification(next, admin.id, {
          type: "report",
          title: "New safety report",
          message: `${user.name} reported ${provider?.name ?? "a provider"}: ${input.reason}`,
          href: "/admin",
        });
      }
      persistImmediate(next);
      emitSystemEvent({
        type: "report",
        message: "New provider report submitted",
      });
      return {};
    },
    [db, user, persistImmediate, appendNotification, emitSystemEvent]
  );

  const resolveReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      persistImmediate(resolveReportRecord(db, reportId));
    },
    [db, persistImmediate]
  );

  const dismissReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      persistImmediate(dismissReportRecord(db, reportId));
    },
    [db, persistImmediate]
  );

  const banProviderFromReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      const report = db.reports.find((r) => r.id === reportId);
      if (!report) return;
      const provider = db.providers.find((p) => p.id === report.providerId);
      if (!provider) return;
      const banResult = banUserRecord(db, provider.userId, true);
      if (banResult.error) {
        return;
      }
      persistImmediate(resolveReportRecord(banResult.db, reportId));
      emitSystemEvent({
        type: "report",
        message: `${provider.name} banned after report review`,
      });
    },
    [db, persistImmediate, emitSystemEvent]
  );

  const getNotifications = useCallback(() => {
    if (!db || !user) return [];
    return (db.notifications ?? [])
      .filter((n) => n.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [db, user, dbRevision]);

  const unreadNotificationCount = useMemo(() => {
    if (!db || !user) return 0;
    return (db.notifications ?? []).filter((n) => n.userId === user.id && !n.read)
      .length;
  }, [db, user, dbRevision]);

  const markNotificationsRead = useCallback(
    (ids?: string[]) => {
      if (!db || !user) return;
      persistImmediate(markNotificationsReadRecord(db, user.id, ids));
    },
    [db, user, persistImmediate]
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
      const result = toggleProviderBlockedSlotRecord(db, user.id, date, time);
      if (result.error) {
        return { error: result.error };
      }
      persistImmediate(result.db);
      return {};
    },
    [db, user, persistImmediate]
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
      bookingId: string;
      rating: number;
      comment: string;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (!input.rating) return { error: "Please select a rating." };
      const validationError = validateReview(db, {
        customerId: user.id,
        bookingId: input.bookingId,
        providerId: input.providerId,
        rating: input.rating,
      });
      if (validationError) {
        return { error: validationError };
      }
      const id = newId("review");
      const result = addReviewRecord(
        db,
        {
          ...input,
          customerId: user.id,
        },
        id
      );
      if (result.error || !result.review) {
        return { error: result.error ?? REVIEW_ALREADY_SUBMITTED_MESSAGE };
      }
      let next = result.db;
      const provider = db.providers.find((p) => p.id === input.providerId);
      const providerUser = provider
        ? db.users.find((u) => u.id === provider.userId)
        : undefined;
      if (providerUser) {
        next = appendNotification(next, providerUser.id, {
          type: "booking",
          title: "New review received",
          message: `${user.name} left a ${input.rating}-star review${provider ? ` for ${provider.name}` : ""}.`,
          href: "/provider/dashboard",
        });
      }
      persistImmediate(next);
      return {};
    },
    [db, user, persistImmediate, appendNotification]
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
      weekAvailability?: boolean[];
      weeklySchedule?: MockProvider["weeklySchedule"];
      availabilityConfig?: MockProvider["availabilityConfig"];
      autoReplyEnabled?: boolean;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      if (!hasProviderRole(user)) {
        return { error: "Enable provider mode on your account to update your profile." };
      }
      const existing = db.providers.find((p) => p.userId === user.id);
      if (!existing) {
        return { error: "Provider profile not found for this account." };
      }
      const next = updateProviderRecord(db, user.id, patch);
      persistImmediate(next);
      return {};
    },
    [db, user, persistImmediate]
  );

  const updateUserProfile = useCallback(
    async (patch: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      address?: string;
    }) => {
      if (!db || !user) return { error: "You must be logged in." };
      const result = updateUserProfileRecord(db, user.id, patch);
      if (result.error) return { error: result.error };
      persistImmediate(result.db);
      return {};
    },
    [db, user, persistImmediate]
  );

  const approveProvider = useCallback(
    async (providerId: string, approved: boolean) => {
      if (!db) return;
      const provider = db.providers.find((p) => p.id === providerId);
      let next = approveProviderRecord(db, providerId, approved);
      if (provider && approved) {
        const providerUser = next.users.find((u) => u.id === provider.userId);
        if (providerUser) {
          next = appendNotification(next, providerUser.id, {
            type: "system",
            title: "Account verified",
            message: "🎉 Your provider account has been verified!",
            href: "/provider/dashboard",
          });
        }
        emitSystemEvent({
          type: "booking_accepted",
          message: `Provider verified: ${provider.name}`,
        });
      }
      persistImmediate(next);
    },
    [db, persistImmediate, appendNotification, emitSystemEvent]
  );

  const rejectProvider = useCallback(
    async (providerId: string) => {
      if (!db) return;
      const provider = db.providers.find((p) => p.id === providerId);
      persistImmediate(rejectProviderRecord(db, providerId));
      if (provider) {
        emitSystemEvent({
          type: "booking_declined",
          message: `Provider rejected: ${provider.name}`,
        });
      }
    },
    [db, persistImmediate, emitSystemEvent]
  );

  const banUser = useCallback(
    async (userId: string, banned: boolean) => {
      if (!db || !user || user.role !== "admin") {
        return { error: "Only admins can ban users." };
      }
      const account = db.users.find((u) => u.id === userId);
      const result = banUserRecord(db, userId, banned);
      if (result.error) {
        return { error: result.error };
      }
      persistImmediate(result.db);
      if (banned && session?.userId === userId) {
        setSession(null);
        saveSession(null);
      }
      if (account && banned) {
        emitSystemEvent({
          type: "report",
          message: `User banned: ${account.name}`,
        });
      }
      return {};
    },
    [db, user, persistImmediate, emitSystemEvent, session]
  );

  const setUserRole = useCallback(
    async (userId: string, role: MockUser["role"]) => {
      if (!db || !user || user.role !== "admin") {
        return { error: "Only admins can change user roles." };
      }
      const target = db.users.find((u) => u.id === userId);
      if (!target) return { error: "User not found." };

      const result = updateUserRoleRecord(db, userId, role);
      if (result.error) {
        return { error: result.error };
      }

      let next = result.db;
      if (role === "admin") {
        next = appendNotification(next, userId, {
          type: "system",
          title: "You're now an admin",
          message: "You have full platform admin access. Open the Admin panel from the header.",
          href: "/admin",
        });
      } else if (target.role === "admin") {
        next = appendNotification(next, userId, {
          type: "system",
          title: "Admin access removed",
          message: `Your role is now ${roleLabel(role)}.`,
          href: dashboardPathForRole(role),
        });
      }

      persistImmediate(next);
      emitSystemEvent({
        type: "report",
        message: `${target.name} is now ${roleLabel(role)}`,
      });
      return {};
    },
    [db, user, persistImmediate, appendNotification, emitSystemEvent]
  );

  const updateCustomerAddress = useCallback(
    async (addressInput: string) => {
      const trimmed = addressInput.trim();
      if (!trimmed) {
        return { error: "Please enter your location to see nearby providers." };
      }

      const location = enrichCustomerLocation(trimmed);
      saveCustomerLocation(location);

      if (!db || !user) return {};

      const result = updateUserAddressRecord(db, user.id, trimmed);
      if (result.error) return { error: result.error };
      persistImmediate(result.db);
      return {};
    },
    [db, user, persistImmediate]
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
      const customerAddress =
        filters.customerAddress?.trim() ||
        (user && hasCustomerRole(user)
          ? resolveCustomerAddress({
              address: user.address,
              location: user.location,
              email: user.email,
            })
          : loadCustomerLocation()
            ? locationMatchingKey(loadCustomerLocation()!)
            : undefined);
      const cacheKey = JSON.stringify({ ...filters, customerAddress });
      const cached = filterCacheRef.current;
      if (cached?.db === db && cached.key === cacheKey) {
        return cached.result;
      }

      const effectiveStatus =
        filters.status === "all" ? "all" : filters.status ?? "all";
      const result = filterMockProviders(db, {
        ...filters,
        status: effectiveStatus,
        maxDistance: resolveMaxDistance(filters.maxDistance),
        customerAddress,
      });
      const topRanked = getTopRankedProviders(db, {
        ...filters,
        status: "verified",
        maxDistance: resolveMaxDistance(filters.maxDistance),
        customerAddress,
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
    [db, user]
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
    const activeUserIds = new Set(db.users.map((u) => u.id));
    return favoriteIds
      .map((id) => db.providers.find((p) => p.id === id))
      .filter(
        (p): p is MockProvider =>
          Boolean(p && activeUserIds.has(p.userId))
      );
  }, [db, favoriteIds]);

  const getRecentlyViewedProviders = useCallback(() => {
    if (!db) return [];
    const activeUserIds = new Set(db.users.map((u) => u.id));
    return loadRecentProviderIds()
      .map((id) => db.providers.find((p) => p.id === id))
      .filter(
        (p): p is MockProvider =>
          Boolean(p && activeUserIds.has(p.userId))
      )
      .slice(0, 6);
  }, [db]);

  const getProvider = useCallback(
    (id: string) => {
      const provider = db?.providers.find((p) => p.id === id);
      if (!provider) return undefined;
      if (!db?.users.some((u) => u.id === provider.userId)) return undefined;
      return provider;
    },
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
        adminCount: 0,
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
    dbRevision,
    session,
    user,
    activeMode,
    loading,
    login,
    register,
    demoLogin,
    listAccounts,
    switchAccount,
    switchMode,
    enableProviderRole,
    logout,
    createBooking,
    completeBooking,
    getAvailableSlots,
    getAvailableDates,
    sendChatMessage,
    getChatMessages,
    getDirectMessages,
    listConversations,
    sendDirectMessage,
    advancedSearch: advancedSearchFn,
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
    updateUserProfile,
    approveProvider,
    rejectProvider,
    banUser,
    deleteUser,
    deleteMyAccount,
    setUserRole,
    updateCustomerAddress,
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
